import { ROLE_ACCOUNT, STORAGE_KEY } from "./const.js";

// CHỨC NĂNG 1: Hiển thị thông báo Toast nhỏ (Popup Toast)
export function handleShowToast(title, message, time) {
  const toast = document.getElementById("liveToast");

  // 1. Gán tiêu đề thông báo
  const titleToast = toast.querySelector(".me-auto");
  titleToast.innerHTML = title;

  // 2. Định dạng hiển thị ngày giờ Việt Nam
  const timeContent = toast.querySelector("small");
  const options = {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false, // Định dạng 24 giờ
  };
  const formattedDate = time.toLocaleString("vi-VN", options);
  timeContent.innerHTML = formattedDate;

  // 3. Gán nội dung thông báo chính
  const content = toast.querySelector(".toast-body");
  content.innerHTML = message;

  // 4. Kích hoạt hiển thị Toast bằng Bootstrap JS
  const toastBootstrap = bootstrap.Toast.getOrCreateInstance(toast);
  toastBootstrap.show();
}

// CHỨC NĂNG 2: Tính toán và hiển thị tổng số lượng sản phẩm trong giỏ hàng (Cart Badge)
export const renderCartCount = () => {
  // Lấy dữ liệu giỏ hàng từ LocalStorage
  const cart = JSON.parse(localStorage.getItem("cart")) || [];

  // Tính tổng số lượng (dùng hàm reduce để cộng dồn quantity của các item)
  const totalQuantity = cart.reduce((sum, item) => {
    return sum + item.quantity;
  }, 0);

  // Hiển thị số lượng lên badge ".cart-count" (nếu có trên màn hình)
  const cartCount = document.querySelector(".cart-count");
  if (cartCount) {
    cartCount.textContent = totalQuantity;
  }
};

// CHỨC NĂNG 3: Khởi tạo thanh Header (Đăng nhập, Đăng xuất, Phân quyền Admin)
export const initHeader = () => {
  const headerIconDiv = document.querySelector(".header-icon");
  if (!headerIconDiv) return;

  // 1. Kiểm tra tài khoản đã đăng nhập trong localStorage
  const userLogged = JSON.parse(localStorage.getItem(STORAGE_KEY.account));
  let isLoggedIn = false;
  let username = "";
  let role = "";

  if (userLogged) {
    // Nếu phiên đăng nhập vẫn còn hạn hiệu lực
    if (userLogged.session > Date.now()) {
      isLoggedIn = true;
      username = userLogged.username || userLogged.email;
      role = userLogged.role;
    } else {
      // Hết hạn phiên thì xóa tài khoản khỏi localStorage
      localStorage.removeItem(STORAGE_KEY.account);
    }
  }

  // 2. Dựng chuỗi HTML Dropdown Menu dựa theo trạng thái đăng nhập
  let dropdownHTML = "";
  if (isLoggedIn) {
    dropdownHTML = `
      <ul class="user-info">
        <li style="padding: 10px 16px; font-weight: 600; color: #e5a030; font-size: 14px; border-bottom: 1px solid #f0f0f0;">
          <i class="fa-solid fa-circle-user"></i> ${username}
        </li>
        ${
          role === ROLE_ACCOUNT.admin
            ? `
        <li><a href="admin.html"><i class="fa-solid fa-gear"></i> Quản trị</a></li>
        <li class="divider"></li>
        `
            : ""
        }
        <li class="signbtn"><a href="#" id="btn-logout"><i class="fa-solid fa-right-to-bracket"></i> Đăng xuất</a></li>
      </ul>
    `;
  } else {
    dropdownHTML = `
      <ul class="user-info">
        <li class="signbtn"><a href="./login-form.html"><i class="fa-solid fa-right-to-bracket"></i> Đăng nhập</a></li>
        <li class="signbtn"><a href="./signup-form.html"><i class="fa-solid fa-user-plus"></i> Đăng ký</a></li>
      </ul>
    `;
  }

  // 3. Chèn giao diện Dropdown Menu vào Header
  const existingUserInfo = headerIconDiv.querySelector(".user-info");
  if (existingUserInfo) {
    existingUserInfo.remove();
  }
  headerIconDiv.insertAdjacentHTML("beforeend", dropdownHTML);

  // 4. Xử lý đóng/mở (toggle) Dropdown Menu khi click vào biểu tượng User
  const userIcon = document.getElementById("user-icon");
  const userInfoMenu = headerIconDiv.querySelector(".user-info");

  if (userIcon && userInfoMenu) {
    userIcon.addEventListener("click", (e) => {
      e.stopPropagation(); // Ngăn sự kiện nổi bọt
      userInfoMenu.classList.toggle("show");
    });

    // Bấm ra vùng ngoài menu thì tự động ẩn Dropdown đi
    document.addEventListener("click", () => {
      userInfoMenu.classList.remove("show");
    });

    userInfoMenu.addEventListener("click", (e) => {
      e.stopPropagation();
    });
  }

  // 5. Xử lý nút ĐĂNG XUẤT (Logout)
  const btnLogout = document.getElementById("btn-logout");
  if (btnLogout) {
    btnLogout.addEventListener("click", (e) => {
      e.preventDefault();
      // Xóa thông tin đăng nhập trong LocalStorage
      localStorage.removeItem(STORAGE_KEY.account);
      handleShowToast("Thông báo", "Đăng xuất thành công!", new Date());

      setTimeout(() => {
        window.location.href = "./index.html"; // Redirect về trang chủ
      }, 1000);
    });
  }
};
