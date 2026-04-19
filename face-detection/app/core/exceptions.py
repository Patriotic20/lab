class AppError(Exception):
    status_code: int = 500
    message: str = "Internal server error"

    def __init__(self, message: str | None = None):
        self.message = message or self.__class__.message
        super().__init__(self.message)


class VideoUnreadableError(AppError):
    status_code = 400
    message = "Video file is corrupted or unreadable"


class UnsupportedMediaTypeError(AppError):
    status_code = 400
    message = "Unsupported video format. Accepted: mp4, avi, mov, mkv, webm"


class FileTooLargeError(AppError):
    status_code = 413
    message = "File exceeds maximum allowed size"


class NoFileProvidedError(AppError):
    status_code = 422
    message = "No video file was provided"
