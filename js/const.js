export const REGEX_EMAIL = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

export const REGEX_PASSWORD =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

export const ROLE_ACCOUNT = {
  user: "user",
  admin: "admin",
};

export const STORAGE_KEY = {
  account: "USER_LOGGED",
};

export const CLOUD_URL =
  "https://api.cloudinary.com/v1_1/dr1hxnpes/image/upload";
