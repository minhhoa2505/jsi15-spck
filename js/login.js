import { GoogleAuthProvider, auth, signInWithPopup } from "./config.js";
import {
  REGEX_PASSWORD,
  REGEX_EMAIL,
  ROLE_ACCOUNT,
  STORAGE_KEY,
} from "./const.js";
import { handleShowToast } from "./common.js";
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

const btnGoogle = document.querySelector("#btn-google");
const provider = new GoogleAuthProvider();

// Lấy thông tin tài khoản đang đăng nhập trong máy
const userLogged = JSON.parse(localStorage.getItem(STORAGE_KEY.account));

// Nếu đã đăng nhập và phiên đăng nhập vẫn còn hạn -> Điều hướng thẳng về trang chủ
if (userLogged && userLogged.session > Date.now()) {
  window.location.href = "./index.html";
}

// CHỨC NĂNG 1: Đăng nhập bằng Google Pop-up
btnGoogle.addEventListener("click", async () => {
  try {
    const result = await signInWithPopup(auth, provider);
    console.log(result);
  } catch (exception) {
    console.log(exception);
  }
});

// CHỨC NĂNG 2: Đăng nhập bằng Form Email & Mật khẩu
const formLogin = document.querySelector("#login-form");
formLogin.addEventListener("submit", async (event) => {
  event.preventDefault(); // Ngăn trình duyệt reload trang khi submit

  const formData = new FormData(formLogin);

  // Lấy giá trị Email & Password nhập vào và cắt bỏ khoảng trắng hai đầu (.trim())
  const inputEmail = formData.get("email").trim();
  const inputPassword = formData.get("password").trim();

  // 1. KIỂM TRA ĐỊNH DẠNG (VALIDATION)
  // Email phải đúng định dạng Regex
  if (!REGEX_EMAIL.test(inputEmail)) {
    handleShowToast("Email", "Email invalid format", new Date());
    return;
  }

  // Mật khẩu phải khớp định dạng Regex (chữ, số, ký tự đặc biệt nếu có)
  if (!REGEX_PASSWORD.test(inputPassword)) {
    handleShowToast("Password", "Password invalid format", new Date());
    return;
  }

  // 2. TRUY VẤN TÌM TÀI KHOẢN TRÊN FIRESTORE
  // Tạo truy vấn trong collection "users" tìm tài khoản có email trùng khớp
  const userRef = collection(db, "users");
  const q = query(userRef, where("email", "==", inputEmail));
  const snapshot = await getDocs(q);

  let isValidAccount = false; // Biến cờ xác định đăng nhập đúng hay sai

  // Duyệt qua kết quả tìm thấy để đối chiếu mật khẩu
  snapshot.forEach((docItem) => {
    const { username, email, password, role, avartar } = docItem.data();
    
    // Nếu trùng khớp cả Email và Mật khẩu
    if (email === inputEmail && password === inputPassword) {
      isValidAccount = true;
      const now = new Date();
      
      // TẠO PHIÊN ĐĂNG NHẬP (Lưu trong LocalStorage có hiệu lực 7 ngày)
      localStorage.setItem(
        STORAGE_KEY.account,
        JSON.stringify({
          id: docItem.id,
          username,
          email,
          password,
          role,
          avartar,
          // Thời hạn phiên = thời gian hiện tại + 7 ngày (tính bằng mili-giây)
          session: now.getTime() + 7 * 24 * 60 * 60 * 1000,
        }),
      );
      return;
    }
  });

  // Nếu thông tin tài khoản sai, báo lỗi bằng Toast và chặn tiến trình
  if (!isValidAccount) {
    handleShowToast("Login", "Invalid email or password", new Date());
    return;
  }

  // Nếu đăng nhập thành công
  handleShowToast("Login", "Login successful", new Date());
  formLogin.reset(); // Reset trống các ô nhập liệu
  window.location.href = "./index.html"; // Chuyển về trang chủ
});
