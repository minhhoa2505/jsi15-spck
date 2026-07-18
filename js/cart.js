import {
  collection,
  doc,
  db,
  getDoc,
} from "./config.js";

import { ROLE_ACCOUNT, STORAGE_KEY } from "./const.js";
import { handleShowToast, renderCartCount, initHeader } from "./common.js";

// Lấy tài khoản đăng nhập hiện tại
const currentAccount = JSON.parse(localStorage.getItem(STORAGE_KEY.account));

// Chặn truy cập nếu chưa đăng nhập
if (!currentAccount || currentAccount.session < Date.now()) {
  localStorage.removeItem(STORAGE_KEY.account);
  window.location.href = "./login-form.html";
}

// CHỨC NĂNG 1: Render toàn bộ giao diện giỏ hàng (Cart Page)
const renderCart = async () => {
  // Lấy dữ liệu giỏ hàng hiện tại từ LocalStorage
  const cart = JSON.parse(localStorage.getItem("cart")) || [];
  
  const activeLayout = document.getElementById("active-cart-layout");
  const emptyLayout = document.getElementById("empty-cart-layout");
  const titleCount = document.getElementById("cart-title-count");

  // Nếu giỏ hàng trống, ẩn layout giỏ hàng hoạt động, hiện layout trống
  if (cart.length === 0) {
    if (activeLayout) activeLayout.classList.add("d-none");
    if (emptyLayout) emptyLayout.classList.remove("d-none");
    if (titleCount) titleCount.textContent = "(0 sản phẩm)";
    return;
  }

  if (activeLayout) activeLayout.classList.remove("d-none");
  if (emptyLayout) emptyLayout.classList.add("d-none");

  const cartItemsWrapper = document.querySelector(".cart-items-wrapper");
  if (!cartItemsWrapper) return;

  // Hiển thị vòng xoay loading khi chờ lấy dữ liệu sản phẩm từ Firestore
  cartItemsWrapper.innerHTML = `
    <div class="text-center py-5">
      <div class="spinner-border text-warning" role="status">
        <span class="visually-hidden">Đang tải giỏ hàng...</span>
      </div>
    </div>
  `;

  // Gọi database song song để lấy chi tiết từng sản phẩm theo ID trong giỏ hàng
  const fetchPromises = cart.map(async (item) => {
    try {
      const productRef = doc(db, "products", item.id);
      const snap = await getDoc(productRef);
      if (snap.exists()) {
        return {
          ...item,
          details: snap.data()
        };
      }
    } catch (e) {
      console.error("Lỗi lấy thông tin sản phẩm:", item.id, e);
    }
    return null;
  });

  // Chờ tất cả tiến trình fetch hoàn thành và lọc bỏ phần tử lỗi (null)
  const cartWithDetails = (await Promise.all(fetchPromises)).filter(item => item !== null);

  if (cartWithDetails.length === 0) {
    if (activeLayout) activeLayout.classList.add("d-none");
    if (emptyLayout) emptyLayout.classList.remove("d-none");
    if (titleCount) titleCount.textContent = "(0 sản phẩm)";
    return;
  }

  // Hiển thị tổng số lượng đầu sách trong giỏ
  if (titleCount) {
    titleCount.textContent = `(${cartWithDetails.length} sản phẩm)`;
  }

  let html = "";
  let subtotal = 0; // Biến tính tổng tiền tạm tính

  // Vẽ các thẻ Card sản phẩm trong giỏ hàng
  cartWithDetails.forEach(item => {
    const details = item.details;
    const itemSubtotal = details.productPrice * item.quantity;
    subtotal += itemSubtotal;

    html += `
      <div class="cart-item-card" data-id="${item.id}">
        <div class="cart-item-img-wrap">
          <img
            src="${details.imageURL}"
            alt="${details.productName}"
            class="cart-item-img"
          />
        </div>
        <div class="cart-item-info">
          <h5 class="cart-item-name">
            <a href="detail.html?id=${item.id}">${details.productName}</a>
          </h5>
          <p class="cart-item-meta">
            Tác giả: ${details.productAuthor} · NXB: ${details.nxbProduct}
          </p>
          <p class="cart-item-price-unit">
            Đơn giá: <span class="price-val">${Number(details.productPrice).toLocaleString("vi-VN")} ₫</span>
          </p>
          <div class="cart-item-actions">
            <div class="cart-quantity-control">
              <button
                class="qty-btn btn-minus"
                data-id="${item.id}"
                aria-label="Giảm số lượng"
              >
                <i class="fa-solid fa-minus"></i>
              </button>
              <input
                type="number"
                class="qty-input"
                value="${item.quantity}"
                min="1"
                max="${details.productQuantity}"
                readonly
              />
              <button
                class="qty-btn btn-plus"
                data-id="${item.id}"
                aria-label="Tăng số lượng"
              >
                <i class="fa-solid fa-plus"></i>
              </button>
            </div>
            <span class="in-stock-badge"
              ><i class="fa-solid fa-check"></i> Còn ${details.productQuantity} bộ</span
            >
          </div>
        </div>
        <div class="cart-item-right">
          <div class="cart-item-subtotal">${Number(itemSubtotal).toLocaleString("vi-VN")} ₫</div>
          <button
            class="cart-item-delete-btn"
            data-id="${item.id}"
            title="Xóa khỏi giỏ hàng"
          >
            <i class="fa-solid fa-trash-can"></i>
          </button>
        </div>
      </div>
    `;
  });

  cartItemsWrapper.innerHTML = html;

  // Cập nhật phần tóm tắt thanh toán (Summary)
  // 1. Tạm tính
  const subtotalEl = document.getElementById("summary-subtotal");
  if (subtotalEl) {
    subtotalEl.textContent = `${Number(subtotal).toLocaleString("vi-VN")} ₫`;
  }

  // 2. Tính phí vận chuyển (Miễn phí nếu đơn >= 500.000đ, ngược lại 30.000đ)
  const shipping = subtotal >= 500000 ? 0 : 30000;
  const shippingEl = document.getElementById("summary-shipping");
  if (shippingEl) {
    if (shipping === 0) {
      shippingEl.textContent = "Miễn phí (đơn ≥500K)";
      shippingEl.className = "row-val text-success";
    } else {
      shippingEl.textContent = `${Number(shipping).toLocaleString("vi-VN")} ₫`;
      shippingEl.className = "row-val text-dark";
    }
  }

  // 3. Tính tổng số tiền cuối cùng phải thanh toán
  const total = subtotal + shipping;
  const totalEl = document.getElementById("summary-total");
  if (totalEl) {
    totalEl.textContent = `${Number(total).toLocaleString("vi-VN")} ₫`;
  }
};

// CHỨC NĂNG 2: Khởi tạo các sự kiện click tăng/giảm/xóa và đặt hàng
const initCartEvents = () => {
  const cartItemsWrapper = document.querySelector(".cart-items-wrapper");
  if (!cartItemsWrapper) return;

  // Sử dụng cơ chế Event Delegation để lắng nghe sự kiện click của các nút bên trong Wrapper
  cartItemsWrapper.addEventListener("click", async (e) => {
    const btnMinus = e.target.closest(".btn-minus");
    const btnPlus = e.target.closest(".btn-plus");
    const btnDel = e.target.closest(".cart-item-delete-btn");

    // Xử lý nút GIẢM số lượng (-)
    if (btnMinus) {
      const productId = btnMinus.getAttribute("data-id");
      let cart = JSON.parse(localStorage.getItem("cart")) || [];
      const item = cart.find(i => i.id === productId);
      if (item && item.quantity > 1) {
        item.quantity -= 1;
        localStorage.setItem("cart", JSON.stringify(cart));
        renderCartCount();
        await renderCart();
      }
    }

    // Xử lý nút TĂNG số lượng (+)
    if (btnPlus) {
      const productId = btnPlus.getAttribute("data-id");
      let cart = JSON.parse(localStorage.getItem("cart")) || [];
      const item = cart.find(i => i.id === productId);
      
      if (item) {
        // Truy vấn số lượng thực tế tồn kho hiện tại trên Firestore để chặn nếu tăng quá giới hạn
        const productRef = doc(db, "products", productId);
        const snap = await getDoc(productRef);
        if (snap.exists()) {
          const stock = snap.data().productQuantity;
          if (item.quantity + 1 > stock) {
            handleShowToast("Lỗi số lượng", "Số lượng mua đã đạt tối đa giới hạn tồn kho!", new Date());
            return;
          }
          item.quantity += 1;
          localStorage.setItem("cart", JSON.stringify(cart));
          renderCartCount();
          await renderCart();
        }
      }
    }

    // Xử lý nút XÓA sản phẩm khỏi giỏ hàng (icon thùng rác)
    if (btnDel) {
      const productId = btnDel.getAttribute("data-id");
      if (confirm("Bạn có chắc chắn muốn xóa sản phẩm này khỏi giỏ hàng?")) {
        let cart = JSON.parse(localStorage.getItem("cart")) || [];
        cart = cart.filter(i => i.id !== productId);
        localStorage.setItem("cart", JSON.stringify(cart));
        renderCartCount();
        await renderCart();
        handleShowToast("Giỏ hàng", "Đã xóa sản phẩm thành công", new Date());
      }
    }
  });

  // Xử lý sự kiện nút "ĐẶT HÀNG" (Thanh toán giả lập)
  const btnCheckout = document.getElementById("btn-checkout");
  if (btnCheckout) {
    btnCheckout.addEventListener("click", () => {
      const cart = JSON.parse(localStorage.getItem("cart")) || [];
      if (cart.length === 0) return;

      handleShowToast("Đặt hàng thành công", "Cảm ơn bạn đã mua sắm! Đơn hàng đang được xử lý.", new Date());
      localStorage.removeItem("cart"); // Xóa giỏ hàng trong LocalStorage sau khi thanh toán xong
      renderCartCount();
      
      setTimeout(() => {
        window.location.href = "index.html"; // Redirect về trang chủ sau 1.5s
      }, 1500);
    });
  }
};

// ==========================================
// KHỞI CHẠY TRANG GIỎ HÀNG
// ==========================================
initHeader();
renderCartCount();
renderCart();
initCartEvents();
