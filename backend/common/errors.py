import uuid
from rest_framework.views import exception_handler
from rest_framework.response import Response
from rest_framework import status

class APIError(Exception):
    def __init__(self, code: str, message: str, status_code: int = status.HTTP_400_BAD_REQUEST, details: dict = None):
        self.code = code
        self.message = message
        self.status_code = status_code
        self.details = details or {}
        super().__init__(message)

def custom_exception_handler(exc, context):
    response = exception_handler(exc, context)
    request_id = str(uuid.uuid4())
    
    if isinstance(exc, APIError):
        return Response(
            {
                "error": {
                    "code": exc.code,
                    "message": exc.message,
                    "details": exc.details,
                    "request_id": request_id
                }
            },
            status=exc.status_code
        )
    
    if response is not None:
        custom_data = {
            "error": {
                "code": exc.__class__.__name__.upper(),
                "message": str(response.data.get("detail", response.data)),
                "details": response.data,
                "request_id": request_id
            }
        }
        response.data = custom_data
        return response

    return Response(
        {
            "error": {
                "code": "INTERNAL_SERVER_ERROR",
                "message": "An unexpected server error occurred.",
                "details": str(exc),
                "request_id": request_id
            }
        },
        status=status.HTTP_500_INTERNAL_SERVER_ERROR
    )
