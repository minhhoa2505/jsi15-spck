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
} from "./config.js";

import { CLOUD_URL, ROLE_ACCOUNT, STORAGE_KEY } from "./const.js";
import { handleShowToast, initHeader, renderCartCount } from "./common.js";

// ==========================================
// TRANG CHỦ – LOGIC HIỂN THỊ TRANG CHỦ (INDEX PAGE LOGIC)
// ==========================================

// Biến lưu trữ danh sách sản phẩm lấy từ DB
let allProducts = [];

// CHỨC NĂNG 1: Lấy danh sách sản phẩm từ database Firestore
const renderProducts = async () => {
  // 1. Tạo tham chiếu tới collection "products" trên database
  const productsRef = collection(db, "products");
  
  // 2. Tạo câu truy vấn sắp xếp sản phẩm mới thêm lên đầu
  const q = query(productsRef, orderBy("createdAt", "desc"));
  
  // 3. Gọi API lấy danh sách tài liệu sản phẩm
  const snapshot = await getDocs(q);

  // 4. Map dữ liệu về dạng mảng đối tượng
  allProducts = snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  }));

  // 5. Hiển thị danh sách truyện ra trang chủ
  displayProducts(allProducts);
};

// CHỨC NĂNG 2: Render giao diện card sản phẩm ra trang chủ (Giới hạn 4 sản phẩm nổi bật)
const displayProducts = (productList) => {
  const divParent = document.querySelector("#truyen-noi-bat-list");
  
  if (productList.length === 0) {
    divParent.innerHTML = `<div class="col-12 text-center py-4">Không tìm thấy truyện nào.</div>`;
    return;
  }

  // Lọc lấy 4 sản phẩm đầu tiên (.slice(0, 4)) để làm phần "Sản phẩm nổi bật"
  const htmls = productList.slice(0, 4).map((product) => {
    const {
      productName,
      productPrice,
      productQuantity,
      productStatus,
      imageURL,
    } = product;

    return `
    <div class="col-lg-3 col-md-4 col-sm-6 col-6">
                <a href="detail.html?id=${product.id}" class="box-manga">
                  <div class="box-manga-img">
                    <img src="${imageURL || '/imgs/default-cover.jpg'}" alt="${productName}" />
                    <div class="manga-overlay">
                      <i class="fa-solid fa-cart-shopping"></i> Thêm vào giỏ
                    </div>
                  </div>
                  <div class="manga-info">
                    <h4>${productName}</h4>
                    <div class="manga-price">
                      <span class="price-new">${Number(productPrice).toLocaleString("vi-VN")} ₫</span>
                    </div>
                    <div class="manga-meta">
                      <span class="${productQuantity > 0 ? '' : 'out-of-stock'}">
                        ${productQuantity > 0 ? `<i class="fa-solid fa-box"></i> Còn ${productQuantity}` : `<i class="fa-solid fa-x"></i> Hết hàng`}
                      </span>
                    </div>
                  </div>
                </a>
              </div>
  `;
  });

  // Chèn chuỗi HTML thẻ truyện vào phần tử cha
  divParent.innerHTML = htmls.join("");
};

// ==========================================
// KHỞI CHẠY TRANG CHỦ
// ==========================================
renderProducts();  // Gọi database và tải dữ liệu lên trang chủ
initHeader();      // Khởi tạo menu di động
renderCartCount(); // Hiển thị số lượng giỏ hàng trên icon giỏ hàng ở đầu trang
