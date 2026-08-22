class PDFIngestionError(Exception):
    def __init__(self, message: str):
        super().__init__(message)
        self.message = message


class InvalidPDFFormatError(PDFIngestionError):
    pass


class PDFSizeLimitExceededError(PDFIngestionError):
    pass


class PDFPageLimitExceededError(PDFIngestionError):
    pass


class PDFEncryptedError(PDFIngestionError):
    pass
