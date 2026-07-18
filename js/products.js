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
// TRANG DANH SÁCH SẢN PHẨM (PRODUCTS PAGE LOGIC)
// ==========================================

// Khai báo biến lưu trữ danh sách toàn bộ sản phẩm lấy từ database
let allProducts = [];

// CHỨC NĂNG 1: Lấy toàn bộ sản phẩm từ Firestore Database
const renderProducts = async () => {
  // 1. Tạo tham chiếu tới collection "products" trên Firestore
  const productsRef = collection(db, "products");
  
  // 2. Tạo câu truy vấn sắp xếp sản phẩm mới thêm lên đầu (giảm dần theo createdAt)
  const q = query(productsRef, orderBy("createdAt", "desc"));
  
  // 3. Thực hiện gọi API lấy dữ liệu về
  const snapshot = await getDocs(q);

  // 4. Map dữ liệu snapshot thành mảng đối tượng JS thuận tiện xử lý
  allProducts = snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  }));

  // 5. Gọi hàm hiển thị sản phẩm ra giao diện HTML
  displayProducts(allProducts);
};

// CHỨC NĂNG 2: Render giao diện thẻ (Card) sản phẩm ra màn hình
const displayProducts = (productList) => {
  const divParent = document.querySelector("#truyen-noi-bat-list");
  
  // Kiểm tra nếu danh sách trống thì báo không tìm thấy
  if (productList.length === 0) {
    divParent.innerHTML = `<div class="col-12 text-center py-4">Không tìm thấy truyện nào.</div>`;
    return;
  }

  // Chuyển mảng đối tượng truyện thành chuỗi các thẻ HTML card
  const htmls = productList.map((product) => {
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

  // Ghi đè HTML vào phần tử cha trên trang
  divParent.innerHTML = htmls.join("");
};

// CHỨC NĂNG 3: Tìm kiếm trực tiếp (Live Search) theo Tên truyện hoặc Tác giả
const searchInput = document.querySelector("#product-search-input");
if (searchInput) {
  // Lắng nghe sự kiện gõ phím (input event)
  searchInput.addEventListener("input", (e) => {
    const keyword = e.target.value.toLowerCase().trim(); // Lấy từ khóa, viết thường và xóa khoảng trắng thừa
    
    // Lọc danh sách truyện gốc (allProducts) khớp với từ khóa tìm kiếm
    const filteredProducts = allProducts.filter(product => 
      product.productName.toLowerCase().includes(keyword) || 
      (product.productAuthor && product.productAuthor.toLowerCase().includes(keyword))
    );
    
    // Render lại giao diện với danh sách đã lọc
    displayProducts(filteredProducts);
  });
}

// ==========================================
// KHỞI CHẠY TRANG
// ==========================================
renderProducts(); // Gọi API lấy sản phẩm
initHeader();     // Khởi tạo menu di động
renderCartCount(); // Cập nhật số lượng giỏ hàng trên icon
