
import json
import os
from pathlib import Path

from django.conf import settings
from django.http import JsonResponse, HttpResponse
from django.shortcuts import render
from django.views.decorators.http import require_POST
from google import genai


def home(request):
    return render(request, "assistant/index.html")


def service_worker(request):
    worker_path = (
        Path(settings.BASE_DIR)
        / "static"
        / "assistant"
        / "service-worker.js"
    )

    try:
        worker_code = worker_path.read_text(encoding="utf-8")
    except OSError:
        return HttpResponse("Service worker file not found.", status=404)

    response = HttpResponse(
        worker_code,
        content_type="application/javascript; charset=utf-8",
    )
    response["Service-Worker-Allowed"] = "/"
    response["Cache-Control"] = "no-cache"
    return response


@require_POST
def chat_api(request):
    if not settings.GEMINI_API_KEY:
        return JsonResponse(
            {"error": "Gemini API key is missing. Check your .env file."},
            status=500,
        )

    try:
        data = json.loads(request.body)
    except (json.JSONDecodeError, UnicodeDecodeError):
        return JsonResponse({"error": "Invalid request data."}, status=400)

    prompt = data.get("message", "")

    if not isinstance(prompt, str):
        return JsonResponse({"error": "Message must be text."}, status=400)

    prompt = prompt.strip()

    if not prompt:
        return JsonResponse({"error": "Please enter a question."}, status=400)

    if len(prompt) > 4000:
        return JsonResponse(
            {"error": "Your question must not exceed 4000 characters."},
            status=400,
        )

    try:
        client = genai.Client(api_key=settings.GEMINI_API_KEY)
        response = client.models.generate_content(
            model="gemini-3.8-flash",
            contents=prompt,
        )

        answer = response.text

        if not answer:
            return JsonResponse(
                {"error": "Gemini returned no text. Please try another question."},
                status=502,
            )

        return JsonResponse({"response": answer})

    except Exception as error:
        print(f"Gemini API error: {type(error).__name__}: {error}")
        return JsonResponse(
            {"error": "Gemini request failed. Check the VS Code terminal for details."},
            status=502,
        )
