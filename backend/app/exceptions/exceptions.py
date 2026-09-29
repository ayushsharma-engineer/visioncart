class AppException(Exception):
    def __init__(
        self,
        code: str,
        message: str,
        status_code: int
    ):
        self.code = code
        self.message = message
        self.status_code = status_code

        super().__init__(message)


class NotFoundException(AppException):
    def __init__(
        self,
        code: str,
        message: str
    ):
        super().__init__(
            code=code,
            message=message,
            status_code=404
        )


class UnauthorizedException(AppException):
    def __init__(
        self,
        code: str,
        message: str
    ):
        super().__init__(
            code=code,
            message=message,
            status_code=401
        )


class ForbiddenException(AppException):
    def __init__(
        self,
        code: str,
        message: str
    ):
        super().__init__(
            code=code,
            message=message,
            status_code=403
        )


class ConflictException(AppException):
    def __init__(
        self,
        code: str,
        message: str
    ):
        super().__init__(
            code=code,
            message=message,
            status_code=409
        )