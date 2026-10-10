import json
from unittest.mock import patch

from django.contrib.auth import get_user_model
from django.http import HttpResponseRedirect
from django.test import Client, TestCase


class FrontendSessionTests(TestCase):
    def setUp(self):
        self.client = Client(enforce_csrf_checks=True)
        self.account = get_user_model().objects.create_user(
            username="testprovider", email="provider@example.test", password="test-secret-42"
        )

    def token(self):
        return self.client.get("/api/frontend/session/").json()["csrf_token"]

    def post_login(self, token, password="test-secret-42"):
        return self.client.post("/api/frontend/login/", json.dumps({"login": "testprovider", "password": password}),
                                content_type="application/json", HTTP_X_CSRFTOKEN=token)

    def test_session_does_not_invent_provider_permissions(self):
        response = self.client.get("/api/frontend/session/")
        self.assertIsNone(response.json()["user"])
        self.assertEqual(response.json()["permissions"], {})
        self.assertIn("no-store", response["Cache-Control"])
        self.assertTrue(response.json()["csrf_token"])

    def test_allauth_login_session_and_logout(self):
        response = self.post_login(self.token())
        self.assertEqual(response.status_code, 200, response.content)
        self.assertEqual(response.json()["user"]["id"], self.account.pk)
        self.assertEqual(self.client.get("/api/frontend/session/").json()["user"]["username"], "testprovider")
        token = response.json()["csrf_token"]
        response = self.client.post("/api/frontend/logout/", "{}", content_type="application/json", HTTP_X_CSRFTOKEN=token)
        self.assertEqual(response.status_code, 200)
        self.assertIsNone(response.json()["user"])

    def test_login_rejects_missing_csrf(self):
        self.assertEqual(self.post_login("").status_code, 403)

    def test_logout_rejects_missing_csrf_and_get(self):
        self.assertEqual(self.client.post("/api/frontend/logout/").status_code, 403)
        self.assertEqual(self.client.get("/api/frontend/logout/").status_code, 405)

    def test_bad_password_is_not_a_successful_login(self):
        response = self.post_login(self.token(), "wrong-password")
        self.assertEqual(response.status_code, 400)
        self.assertIsNone(self.client.get("/api/frontend/session/").json()["user"])

    def test_malformed_json_is_rejected(self):
        for body in ("not-json", "[]", '{"login": 12, "password": null}'):
            response = self.client.post("/api/frontend/login/", body, content_type="application/json", HTTP_X_CSRFTOKEN=self.token())
            self.assertEqual(response.status_code, 400)

    def test_additional_allauth_steps_do_not_claim_authenticated_session(self):
        with patch("allauth.account.forms.LoginForm.login", return_value=HttpResponseRedirect("/accounts/confirm-email/")):
            response = self.post_login(self.token())
        self.assertEqual(response.status_code, 409)
        self.assertEqual(response.json()["continue_url"], "/accounts/confirm-email/")
