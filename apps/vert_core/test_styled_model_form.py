"""Run with: python -B apps/vert_core/test_styled_model_form.py"""

import ast
from pathlib import Path
import unittest

import django
from django import forms
from django.conf import settings
from django.db import models
from django.test import SimpleTestCase


class StyledModelFormTests(SimpleTestCase):
    def test_checkbox_textarea_date_cfg_path(self):
        # CFG: 1 -> 2 -> 3 -> 4 -> 5 -> 2 -> 3 -> 4 -> 6 -> 7 -> 9 -> 10
        #      -> 2 -> 3 -> 4 -> 6 -> 8 -> 9 -> 10 -> 11 -> 2 -> 12
        # Isolate the original class from forms.py's obsolete model imports.
        source_path = Path(__file__).with_name("forms.py")
        tree = ast.parse(source_path.read_text(), filename=str(source_path))
        tree.body = [
            node for node in tree.body
            if isinstance(node, ast.Assign)
            or (isinstance(node, ast.ClassDef) and node.name == "StyledModelForm")
        ]
        namespace = {"forms": forms, "__name__": __name__}
        exec(compile(tree, str(source_path), "exec"), namespace)

        class TestModel(models.Model):
            class Meta:
                app_label = "vert_core"

        class TestForm(namespace["StyledModelForm"]):
            checkbox = forms.BooleanField(required=False)
            textarea = forms.CharField(widget=forms.Textarea())
            date = forms.DateField(widget=forms.DateInput())

            class Meta:
                model = TestModel
                fields = ("checkbox", "textarea", "date")

        form = TestForm()

        self.assertEqual(list(form.fields), ["checkbox", "textarea", "date"])
        self.assertEqual(form.fields["checkbox"].widget.attrs["class"], "form-checkbox")
        self.assertEqual(
            form.fields["textarea"].widget.attrs["class"], "form-input form-input--textarea"
        )
        self.assertEqual(form.fields["date"].widget.attrs["class"], "form-input")
        self.assertEqual(form.fields["date"].widget.attrs["type"], "date")


if __name__ == "__main__":
    settings.configure(USE_I18N=False)
    django.setup()
    unittest.main(verbosity=2)
