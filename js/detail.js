import {
  collection,
  doc,
  setDoc,
  db,
  addDoc,
  getDocs,
  query,
  where,
  orderBy,
  deleteDoc,
  updateDoc,
  onSnapshot,
  getDoc,
} from "./config.js";

import { CLOUD_URL, ROLE_ACCOUNT, STORAGE_KEY } from "./const.js";
import { handleShowToast, renderCartCount, initHeader } from "./common.js";

// CHỨC NĂNG 1: Đọc tham số "id" từ URL (Query String)
// Ví dụ: detail.html?id=zXyW -> lấy ra "zXyW"
const params = new URLSearchParams(window.location.search);
const id = params.get("id");

// Nếu không tìm thấy id trên URL, hiển thị thông báo lỗi
if (!id) {
  document.querySelector(".detail-desc").innerHTML =
    `<p style="color:red;">Không tìm thấy sản phẩm. <a href="products.html">Quay lại danh sách</a></p>`;
}

// CHỨC NĂNG 2: Xử lý thêm sản phẩm vào giỏ hàng (LocalStorage)
const handleAddCart = (product, quantity) => {
  // Lấy danh sách giỏ hàng hiện tại từ LocalStorage (nếu chưa có thì khởi tạo mảng rỗng)
  const cart = JSON.parse(localStorage.getItem("cart")) || [];

  const cartItem = {
    id: product.id,
    quantity: quantity,
  };

  // Kiểm tra xem sản phẩm này đã tồn tại trong giỏ hàng chưa
  const existProduct = cart.find((item) => item.id === product.id);

  if (existProduct) {
    // Nếu có rồi, kiểm tra xem tổng số lượng mua mới + cũ có vượt quá số lượng tồn kho trong DB không
    if (existProduct.quantity + quantity > product.productQuantity) {
      handleShowToast("Error", "Số lượng vượt quá tồn kho!", new Date());
      return;
    }

    // Nếu không vượt quá, thực hiện cộng dồn số lượng
    existProduct.quantity += quantity;
    handleShowToast("Message", "Đã cập nhật số lượng giỏ hàng", new Date());
  } else {
    // Nếu chưa có, push sản phẩm mới vào mảng giỏ hàng
    cart.push(cartItem);
    handleShowToast(
      "Success",
      "Thêm sản phẩm vào giỏ hàng thành công!",
      new Date(),
    );
  }

  // Lưu lại giỏ hàng mới vào LocalStorage dưới dạng chuỗi JSON
  localStorage.setItem("cart", JSON.stringify(cart));

  // Cập nhật lại số lượng hiển thị trên icon giỏ hàng ở header
  renderCartCount();
};

// CHỨC NĂNG 3: Lấy thông tin chi tiết của truyện từ Firestore Database và hiển thị lên UI
const renderDetailProduct = async () => {
  // 1. Tạo tham chiếu tới tài liệu (document) cụ thể dựa theo "id" trên Firestore
  const productRef = doc(db, "products", id);
  const snapshot = await getDoc(productRef);

  // Kiểm tra tài liệu có tồn tại trên Database không
  if (!snapshot.exists()) {
    console.log("Không tìm thấy sản phẩm");
    return;
  }

  // Gộp document ID và dữ liệu trường lại thành một đối tượng sản phẩm duy nhất
  const product = { id: snapshot.id, ...snapshot.data() };
  const {
    imageURL,
    productAuthor,
    productName,
    productPrice,
    productQuantity,
    productStatus,
    productTags,
    productsDesc,
    nxbProduct,
  } = product;

  // 2. Render Breadcrumb điều hướng (Trang chủ > Thể loại > Tên Truyện)
  const navTag = document.querySelector("#tag");
  const sepTag = document.querySelector("#sep-tag");
  const current = document.querySelector("#current");

  current.textContent = product.productName;

  if (product.productTags.length > 0) {
    navTag.textContent = product.productTags[0];
  } else {
    navTag.style.display = "none";
    sepTag.style.display = "none";
  }

  // 3. Render phần Ảnh bìa sách bên trái
  const divImgWrap = document.querySelector(".detail-img-wrap");
  const divVolumeThumbs = document.querySelector(".volume-thumbs");
  divImgWrap.innerHTML = `
    <img
      src="${imageURL}"
      alt="${productName}"
      class="detail-cover"
    />
    <div class="detail-badges">
      <span class="badge-status authentic">Chính hãng NXB Kim Đồng</span>
    </div>
  `;

  divVolumeThumbs.innerHTML = ``; // Bỏ qua ảnh phụ ảo

  // 4. Render phần thông tin giá, mô tả, nút mua và bộ chọn số lượng ở giữa
  const divDetailDesc = document.querySelector(".detail-desc");
  divDetailDesc.innerHTML = `
    <h1>${productName}</h1>
    <p class="alt-title">Tác giả: ${productAuthor}</p>

    <!-- Trạng thái kho -->
    <div class="detail-rating-row">
      <span class="sold-count">
        Tình trạng: <strong>${productQuantity > 0 ? "Còn hàng" : "Hết hàng"}</strong>
      </span>
    </div>

    <!-- Giá bán -->
    <div class="detail-price-box">
      <span class="detail-price">${Number(productPrice).toLocaleString("vi-VN")} ₫</span>
    </div>

    <!-- Chọn số lượng mua -->
    <div class="detail-options">
      <div class="option-group">
        <label class="option-label">Số lượng:</label>
        <div class="qty-group">
          <button class="qty-btn" id="qty-minus">
            <i class="fa-solid fa-minus"></i>
          </button>
          <input
            type="number"
            class="qty-input"
            id="qty-input"
            value="1"
            min="1"
            max="${productQuantity}"
          />
          <button class="qty-btn" id="qty-plus">
            <i class="fa-solid fa-plus"></i>
          </button>
          <span class="qty-stock">Còn ${productQuantity} sản phẩm trong kho</span>
        </div>
      </div>
    </div>

    <!-- Các nút thao tác -->
    <div class="detail-actions">
      <button class="btn-action-primary btn-buy" id="btn-buy">
        <i class="fa-solid fa-bolt"></i> Mua ngay
      </button>
      <button class="btn-action-secondary btn-cart" id="btn-cart">
        <i class="fa-solid fa-cart-plus"></i> Thêm vào giỏ hàng
      </button>
    </div>
  `;

  // Lấy các phần tử nút số lượng và nút mua vừa render ra
  const qtyInput = document.querySelector("#qty-input");
  const qtyMinusBtn = document.querySelector("#qty-minus");
  const qtyPlusBtn = document.querySelector("#qty-plus");
  const btnBuy = document.querySelector(".btn-buy");
  const btnCart = document.querySelector(".btn-cart");

  // Xử lý nút tăng số lượng (+)
  qtyPlusBtn.addEventListener("click", () => {
    if (Number(qtyInput.value) >= productQuantity) {
      return; // Không cho tăng quá số lượng tồn kho
    }
    qtyInput.value = Number(qtyInput.value) + 1;
  });

  // Xử lý nút giảm số lượng (-)
  qtyMinusBtn.addEventListener("click", () => {
    if (Number(qtyInput.value) <= 1) {
      return; // Không cho giảm xuống dưới 1
    }
    qtyInput.value = Number(qtyInput.value) - 1;
  });

  // Gắn sự kiện click cho nút "Thêm vào giỏ hàng"
  btnCart.addEventListener("click", () => {
    handleAddCart(product, Number(qtyInput.value));
  });

  // CHẶN BẤM / VÔ HIỆU HÓA form nếu sản phẩm đã hết hàng trong DB (tồn kho = 0)
  if (productQuantity > 0) {
    qtyInput.value = 1;
    qtyInput.min = 1;
    qtyInput.max = productQuantity;
  } else {
    qtyInput.value = 0;
    qtyMinusBtn.disabled = true;
    qtyPlusBtn.disabled = true;
    btnBuy.disabled = true;
    btnCart.disabled = true;
    qtyInput.disabled = true;
  }

  // 5. Render thông tin chi tiết vào sidebar bên phải (Tác giả, Thể loại, NXB)
  const divDetailSidebar = document.querySelector(".detail-info-sidebar");
  divDetailSidebar.innerHTML = `
    <div class="info-card">
      <h4 class="info-card-title">
        <i class="fa-solid fa-circle-info"></i> Thông tin chi tiết
      </h4>
      <table class="detail-table">
        <tbody>
          <tr>
            <td class="label">Thể loại</td>
            <td>
              ${productTags.map((tag) => `<span class="genre-pill">${tag}</span>`).join(", ")}
            </td>
          </tr>
          <tr>
            <td class="label">Tác giả</td>
            <td>${productAuthor}</td>
          </tr>
          <tr>
            <td class="label">Nhà xuất bản</td>
            <td>${nxbProduct || "Đang cập nhật"}</td>
          </tr>
        </tbody>
      </table>
    </div>
  `;

  // 6. Render phần Tóm tắt/Mô tả cốt truyện ở dưới cùng
  const divDetailsynopsis = document.querySelector(".detail-synopsis");
  divDetailsynopsis.innerHTML = `
    <h4><i class="fa-solid fa-file-lines"></i> Mô tả sản phẩm</h4>
    <p>${productsDesc || "Chưa có mô tả chi tiết cho sản phẩm này."}</p>
  `;
};

// ==========================================
// KHỞI CHẠY TRANG CHI TIẾT
// ==========================================
renderDetailProduct(); // Lấy chi tiết sản phẩm và vẽ giao diện
initHeader(); // Khởi tạo menu di động
renderCartCount(); // Hiển thị số lượng giỏ hàng hiện tại
