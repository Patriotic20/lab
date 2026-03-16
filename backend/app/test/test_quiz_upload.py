import pytest
from httpx import AsyncClient
import os
import tempfile

@pytest.mark.asyncio
async def test_quiz_upload_image(auth_client: AsyncClient, monkeypatch):
    # Use a temporary writable directory to avoid permission issues with the
    # root-owned uploads/questions directory in the real project.
    with tempfile.TemporaryDirectory() as tmp_dir:
        # Patch the upload_dir setting so the repository writes to our temp dir
        from core.config import settings
        monkeypatch.setattr(settings.file_url, "upload_dir", tmp_dir)

        # Create a dummy image file
        file_content = b"fake image content"
        files = {"file": ("test_image.jpg", file_content, "image/jpeg")}

        response = await auth_client.post("/quiz/upload", files=files)

        assert response.status_code == 200
        data = response.json()
        assert "url" in data

        # Verify that a file was written inside the temp dir
        filename = data["url"].split("/")[-1]
        file_path = os.path.join(tmp_dir, filename)
        assert os.path.exists(file_path)
