import {
  collection,
  doc,
  setDoc,
  db,
  addDoc,
  getDocs,
  query,
  where,
} from "./config.js";

import {
  REGEX_PASSWORD,
  REGEX_EMAIL,
  ROLE_ACCOUNT,
  STORAGE_KEY,
} from "./const.js";
import { handleShowToast } from "./common.js";

const registerForm = document.querySelector("#signup-form");
const userLogged = JSON.parse(localStorage.getItem(STORAGE_KEY.account));

if (userLogged && userLogged.session > Date.now()) {
  window.location.href = "./index.html";
}

registerForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const formData = new FormData(registerForm);

  // Lấy dữ liệu field + loại bỏ hai đầu khoảng trắng
  const email = formData.get("email").trim();
  const password = formData.get("password").trim();

  // Validation
  if (!REGEX_EMAIL.test(email)) {
    handleShowToast("Email", "Email invalid format", new Date());
    return;
  }

  if (!REGEX_PASSWORD.test(password)) {
    handleShowToast("Password", "Passsword invalid format", new Date());
    return;
  }

  //   Bắt lỗi
  try {
    // Read data
    const userRef = collection(db, "users");
    const q = query(userRef, where("email", "==", email));
    const snapshot = await getDocs(q);

    // Check data có được trả về hay không
    if (!snapshot.empty) {
      handleShowToast("Error", "Account already existed", new Date());
      return;
    }

    // Create data
    await addDoc(collection(db, "users"), {
      username: formData.get("username"),
      email: email,
      password: password,
      avartar: formData.get("avatar.com"),
      role: ROLE_ACCOUNT.user,
    });

    registerForm.reset();
    handleShowToast("Success", "Register account successfull !!!", new Date());
  } catch (error) {
    console.error(error);
  }
});
