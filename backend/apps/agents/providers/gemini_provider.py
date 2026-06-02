from google import genai
from django.conf import settings


class GeminiProvider:

    def __init__(self):
        self.client = genai.Client(
            api_key=settings.GEMINI_API_KEY
        )

    def generate(
        self,
        prompt,
        model="gemini-2.5-flash",
        temperature=0.7,
    ):
        response = self.client.models.generate_content(
            model=model,
            contents=prompt,
            config={
                "temperature": temperature
            }
        )

        return response.text