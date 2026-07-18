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
import { handleShowToast } from "./common.js";

// ID của sản phẩm đang chỉnh sửa (null nếu đang ở chế độ Thêm mới)
let editingID = null;

// Element hiển thị hình ảnh xem trước trong Modal Form
const previewImage = document.querySelector("#preview-image");

// =========================================================
// KIỂM TRA BẢO MẬT & PHÂN QUYỀN TRUY CẬP (MIDDLEWARE)
// =========================================================
const currentAdmin = JSON.parse(localStorage.getItem(STORAGE_KEY.account));

// 1. Chặn nếu chưa đăng nhập hoặc hết hạn phiên
if (!currentAdmin || currentAdmin.session < Date.now()) {
  localStorage.removeItem(STORAGE_KEY.account);
  window.location.href = "./login-form.html";
}

// 2. Chặn nếu tài khoản đăng nhập không phải vai trò Admin
if (currentAdmin && currentAdmin.role !== ROLE_ACCOUNT.admin) {
  window.location.href = "./index.html";
}

// Lấy các element form quản lý sản phẩm
const productForm = document.querySelector("#product-form");
const saveProduct = document.querySelector(".btn-modal-save");
const modalTitle = document.querySelector("#modal-title");
const productModal = document.querySelector("#productModal");

// =========================================================
// CHỨC NĂNG 1: Upload hình ảnh lên Cloudinary
// =========================================================
const handleUploadImageProduct = async (imageFile) => {
  // Nếu không chọn file, trả về chuỗi trống
  if (!imageFile || !imageFile.name) {
    return " ";
  }

  const formData = new FormData();
  formData.append("file", imageFile);
  formData.append("upload_preset", "jsi15_preset"); // Preset cấu hình trên Cloudinary

  // Gọi API upload bằng phương thức POST
  const response = await fetch(CLOUD_URL, {
    method: "POST",
    body: formData,
  });

  const data = await response.json();

  if (!response.ok) {
    console.log("upload failed", data);
    return " ";
  }

  // Trả về đường dẫn ảnh tuyệt đối (secure URL) từ Cloudinary
  return data.secure_url;
};

// =========================================================
// CHỨC NĂNG 2: Xử lý Thêm / Cập nhật sản phẩm
// =========================================================
const handleAddProduct = async (e) => {
  e.preventDefault();

  // Đọc thông tin từ các input trong form sản phẩm
  const formDataProduct = new FormData(productForm);
  const nameProduct = formDataProduct.get("product-name");
  const idProduct = formDataProduct.get("product-id");
  const productAuthor = formDataProduct.get("product-tacgia");
  const nxbProduct = formDataProduct.get("product-nxb");
  const priceProduct = formDataProduct.get("product-price");
  const productSL = formDataProduct.get("product-quantity");
  const typeProduct = formDataProduct.get("product-type");
  const tagsProduct = formDataProduct.getAll("product-tags");
  const statusProduct = formDataProduct.get("product-status");
  const imgProduct = formDataProduct.get("product-img");
  const productDesc = formDataProduct.get("product-desc");

  // Validate form cơ bản
  if (!nameProduct.trim()) {
    handleShowToast("Error", "Tên sản phẩm không được để trống!", new Date());
    return;
  }
  if (!priceProduct.trim()) {
    handleShowToast("Error", "Giá sản phẩm không được để trống!", new Date());
    return;
  }
  if (!productAuthor.trim()) {
    handleShowToast("Error", "Tên tác giả không được để trống!", new Date());
    return;
  }
  if (!nxbProduct.trim()) {
    handleShowToast("Error", "Tên nhà xuất bản không được để trống!", new Date());
    return;
  }

  // Kiểm tra trùng mã ID sản phẩm (SKU)
  const isExistID = products.some((product) => {
    return product.productID === idProduct.trim() && product.id !== editingID;
  });

  if (isExistID) {
    handleShowToast("Error", "Mã sản phẩm (SKU) đã tồn tại trong hệ thống!", new Date());
    return;
  }

  // TIẾN TRÌNH 2A: ĐANG TRONG CHẾ ĐỘ CẬP NHẬT (EDIT MODE)
  if (editingID) {
    const productRef = doc(db, "products", editingID);
    let imageURL = previewImage.src; // Mặc định giữ lại ảnh cũ

    // Nếu người dùng chọn file ảnh mới -> Upload đè lên Cloudinary
    if (imgProduct.size > 0) {
      imageURL = await handleUploadImageProduct(imgProduct);
    }
    
    // Cập nhật thông tin lên Firestore
    await updateDoc(productRef, {
      productName: nameProduct,
      productID: idProduct,
      productAuthor: productAuthor,
      nxbProduct,
      productPrice: Number(priceProduct),
      productQuantity: Number(productSL),
      productType: typeProduct,
      productTags: tagsProduct,
      productStatus: statusProduct,
      imageURL: imageURL,
      productsDesc: productDesc,
      updatedAt: new Date(),
    });

    handleShowToast("Success", "Cập nhật sản phẩm thành công!", new Date());
    renderProduct(); // Load lại danh sách bảng
    bootstrap.Modal.getInstance(productModal).hide(); // Ẩn modal form
    return;
  }

  // TIẾN TRÌNH 2B: ĐANG TRONG CHẾ ĐỘ THÊM MỚI (ADD MODE)
  // Upload ảnh lên Cloudinary
  const imageURL = await handleUploadImageProduct(imgProduct);

  // Thêm tài liệu mới vào collection "products" trên Firestore
  await addDoc(collection(db, "products"), {
    productName: nameProduct,
    productID: idProduct,
    productAuthor: productAuthor,
    nxbProduct,
    productPrice: Number(priceProduct),
    productQuantity: Number(productSL),
    productType: typeProduct,
    productTags: tagsProduct,
    productStatus: statusProduct,
    imageURL: imageURL,
    productsDesc: productDesc,
    createdAt: new Date(),
  });

  handleShowToast("Success", "Thêm sản phẩm thành công", new Date());
  renderProduct(); // Tải lại bảng
  bootstrap.Modal.getInstance(productModal).hide(); // Đóng modal
};

let products = []; // Mảng chứa danh sách sản phẩm lấy về từ database

// =========================================================
// CHỨC NĂNG 3: Tải danh sách sản phẩm từ DB và vẽ bảng HTML
// =========================================================
const renderProduct = async () => {
  const productsRef = collection(db, "products");
  const q = query(productsRef, orderBy("createdAt", "desc"));
  const snapshot = await getDocs(q);

  products = snapshot.docs.map((doc) => {
    return {
      id: doc.id,
      ...doc.data(),
    };
  });

  const divParent = document.querySelector("#product-list");
  
  // Vẽ các dòng bảng (TR) tương ứng với từng truyện
  const htmls = products.map((product) => {
    const {
      id,
      productName,
      productID,
      productAuthor,
      productPrice,
      productQuantity,
      productType,
      productTags,
      productStatus,
      imageURL,
    } = product;

    return `
    <tr>
      <td><input type="checkbox" /></td>
      <td><span class="id-badge">${productID}</span></td>
      <td><div class="product-thumb"><img src="${imageURL}" alt="" /></div></td>
      <td><div class="product-name"><strong>${productName}</strong><small>${productType}</small></div></td>
      <td>${productAuthor}</td>
      <td>${productTags.map((tag) => `<span class="genre-pill">${tag}</span>`).join("")}</td>
      <td class="amount">${Number(productPrice).toLocaleString("vi-VN")} ₫</td>
      <td>${productQuantity}</td>
      <td><span class="status-pill completed">${productStatus}</span></td>
      <td>
        <div class="action-btns">
          <a href="detail.html?id=${product.id}" class="action-btn view" title="Xem trang SP"><i class="fa-solid fa-eye"></i></a>
          <button btn-edit-id="${product.id}" class="action-btn edit" title="Chỉnh sửa" data-bs-toggle="modal" data-bs-target="#productModal"><i class="fa-solid fa-pen"></i></button>
          <button btn-del-id="${product.id}" class="action-btn delete" title="Xóa"><i class="fa-solid fa-trash"></i></button>
        </div>
      </td>
    </tr>
    `;
  });

  divParent.innerHTML = htmls.join("");
  
  productDashboard(products); // Cập nhật thống kê trên Dashboard
  await handleDeleteProduct(); // Gắn sự kiện Xóa
  await handleEditProduct();   // Gắn sự kiện Sửa
};

// =========================================================
// CHỨC NĂNG 4: Thống kê Dashboard (Số lượng, tồn kho, hết hàng)
// =========================================================
const productDashboard = (products) => {
  const totalProducts = document.querySelector("#total-products");
  const stockProducts = document.querySelector("#stock-products");
  const outOfStockProducts = document.querySelector("#out-of-stock-products");

  const dashTotal = document.querySelector("#dash-total-products");
  const dashStock = document.querySelector("#dash-stock-products");
  const dashOutOfStock = document.querySelector("#dash-out-of-stock-products");

  const totalCount = products.length;
  // Lọc sản phẩm còn hàng
  const activeProducts = products.filter(
    (product) => product.productStatus === "Còn hàng",
  ).length;
  // Lọc sản phẩm hết hàng
  const inactiveProducts = products.filter(
    (product) => product.productStatus === "Hết hàng",
  ).length;

  // Cập nhật text hiển thị lên giao diện
  if (totalProducts) totalProducts.textContent = totalCount;
  if (stockProducts) stockProducts.textContent = activeProducts;
  if (outOfStockProducts) outOfStockProducts.textContent = inactiveProducts;

  if (dashTotal) dashTotal.textContent = totalCount;
  if (dashStock) dashStock.textContent = activeProducts;
  if (dashOutOfStock) dashOutOfStock.textContent = inactiveProducts;
};

// =========================================================
// CHỨC NĂNG 5: Xóa sản phẩm khỏi database Firestore
// =========================================================
const handleDeleteProduct = async () => {
  const listBtnDel = document.querySelectorAll("[btn-del-id]");
  listBtnDel.forEach((btnDel) => {
    btnDel.addEventListener("click", async () => {
      const id = btnDel.getAttribute("btn-del-id");
      const isConfirm = confirm("Bạn có chắc muốn xóa sản phẩm này khỏi hệ thống?");

      if (!isConfirm) return;
      
      // Xóa document trên Firestore
      await deleteDoc(doc(db, "products", id));
      handleShowToast("Success", "Đã xóa sản phẩm thành công!", new Date());
      renderProduct(); // Load lại bảng sau khi xóa
    });
  });
};

// Thiết lập form về chế độ Thêm mới
const setAddMode = () => {
  editingID = null;
  modalTitle.innerHTML = `<i class="fa-solid fa-book-medical"></i> Thêm sản phẩm mới`;
  productForm.reset();
  previewImage.src = "";
};

// Thiết lập form về chế độ Chỉnh sửa
const setEditMode = () => {
  modalTitle.innerHTML = `<i class="fa-solid fa-book-medical"></i> Chỉnh sửa sản phẩm`;
};

// Bấm nút "Thêm mới" ở góc bảng sẽ mở modal form trống
const addProductBtn = document.querySelector("#btn-add");
if (addProductBtn) {
  addProductBtn.addEventListener("click", setAddMode);
}

// =========================================================
// CHỨC NĂNG 6: Sửa sản phẩm (Đọc chi tiết đổ vào Form)
// =========================================================
const handleEditProduct = async () => {
  const listBtnEdit = document.querySelectorAll("[btn-edit-id]");
  listBtnEdit.forEach((btnEdit) => {
    btnEdit.addEventListener("click", async () => {
      const id = btnEdit.getAttribute("btn-edit-id");
      const product = products.find((product) => product.id === id);
      editingID = product.id; // Gắn ID đang edit
      previewImage.src = product.imageURL; // Xem trước ảnh bìa cũ

      setEditMode();

      // Đổ toàn bộ dữ liệu từ đối tượng truyện đã chọn vào các ô input trong form
      productForm.elements["product-name"].value = product.productName;
      productForm.elements["product-id"].value = product.productID;
      productForm.elements["product-tacgia"].value = product.productAuthor;
      productForm.elements["product-nxb"].value = product.nxbProduct;
      productForm.elements["product-price"].value = product.productPrice;
      productForm.elements["product-quantity"].value = product.productQuantity;
      productForm.elements["product-type"].value = product.productType;
      productForm.elements["product-status"].value = product.productStatus;
      productForm.elements["product-desc"].value = product.productsDesc;
      
      // Xử lý các Checkbox Tag thể loại
      const tagCheckboxes = productForm.querySelectorAll("[name='product-tags']");
      tagCheckboxes.forEach(cb => {
        cb.checked = product.productTags.includes(cb.value);
      });
    });
  });
};

// =========================================================
// KHỞI CHẠY TRANG ADMIN
// =========================================================
renderProduct(); // Vẽ bảng sản phẩm và dashboard
saveProduct.addEventListener("click", handleAddProduct); // Sự kiện nút Save modal form
productModal.addEventListener("hidden.bs.modal", () => {
  setAddMode(); // Trả form về mặc định khi đóng modal
});
