class User:
    def __init__(self, _id: int, _email: str, _username: str, _password: str) -> None:
        self._id = _id
        self._email = _email
        self._username = _username
        self._password = _password

    def login(self, email: str, password: str) -> bool:
        ...

    def logout(self) -> None:
        ...

    def get_email(self) -> str:
        ...

    def set_email(self, email: str) -> None:
        ...

    def get_username(self) -> str:
        ...

    def set_username(self, username: str) -> None:
        ...

    def get_id(self) -> int:
        ...

    def authenticate_pw(self, password: str) -> bool:
        ...

    def validate_account_status(self) -> bool:
        ...

    @classmethod
    def register_user(
        cls,
        _id: int,
        _email: str,
        _username: str,
        _password: str,
    ) -> "User":
        ...
