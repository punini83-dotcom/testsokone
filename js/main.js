let stores =[];
let num = 0; // id振り分け用
let currentStoreId = null; // 現在表示している店舗のID
let isEditMode = false; // 今が編集モードかどうかを保持
let foundItems = []; // 検索にヒットした商品を一時保存する配列

// 全体のタッチイベントを有効にするおまじない
document.addEventListener("touchstart", function(){}, true);

// ページが読み込まれたときにデータを復元する
function loadData() {
    const savedStores = localStorage.getItem('myPriceData');
    const savedNum = localStorage.getItem('myIDCounter');

    if (savedStores) {
        // 文字列をオブジェクト（配列）に戻す
        stores = JSON.parse(savedStores);
    } else {
        stores = []; // データがなければ空
    }

    if (savedNum) {
        num = Number(savedNum);
    } else {
        num = 0;
    }

    // 読み込んだら画面を更新！
    updateShopList(); 
}

//店舗追加
function addshop(){
    const shop = document.getElementById('shopName').value.trim();
    const errorElement = document.getElementById('shopError');

    // まずは警告をリセット（前回の警告を消す）
    errorElement.innerText = "";

    // ① 空欄チェック
    if (shop === "") {
        errorElement.innerText = "※店舗名を入力してください";
        return; // 処理を中断（C++と同じ）
    }

    // ② 重複チェック
    const isDuplicate = stores.some(s => s.shopname === shop);
    if (isDuplicate) {
        errorElement.innerText = "※その店舗は既に登録されています";
        return;
    }

    // ③ 登録処理
    stores.push({id: num, shopname: shop, items: []})
    num++;

    // 入力欄を空にする
    document.getElementById('shopName').value = "";

    // ④ 画面を更新する関数を呼ぶ
    updateShopList();

    saveData();
}
//店舗の表示
function updateShopList() {
    const listArea = document.getElementById('shopList'); // HTML側に <div id="shopList"></div> が必要
    listArea.innerHTML = ""; // 一旦中身を空にする

    stores.forEach(s => {
        // 店舗ごとのHTMLを作る
        listArea.innerHTML += `
            <div class="shop-item">
                <span>${s.shopname}</span>
                <button class="Button" onclick="goToStoreDetail(${s.id})">商品一覧へ</button>
            </div>
        `;
    });
    saveData();
}

//商品一覧
function goToStoreDetail(id){
    currentStoreId = id; // どの店が選ばれたかメモ
    // 1. 画面の切り替え
    document.getElementById('inputPage').style.display = 'none';   // 店舗一覧を隠す
    document.getElementById('shopList').style.display = 'none';   // 店舗一覧を隠す
    document.getElementById('detailPage').style.display = 'flex'; // 商品詳細ページを出す
    const errorElement = document.getElementById('shopError');
    errorElement.innerText = ""; // 商品一覧に入るときはエラーもリセット

    // 2. 選ばれた店のデータを特定（C++の find みたいなもの）
    const store = stores.find(s => s.id === id);
    console.log("探した結果:", store);

    // 3. 店名を表示
    document.getElementById('selectedStoreName').innerText = store.shopname;

    // 4. その店の商品一覧を更新
    updateItemList();
}
// 商品一覧の表示
function updateItemList() {
    const listArea = document.getElementById('itemList');
    const store = stores.find(s => s.id === currentStoreId);
    listArea.innerHTML = "";

    // 編集ボタンのテキストを切り替える
    const btn = document.getElementById('editBtn');
    if (btn) btn.innerText = isEditMode ? "完了" : "編集";

    // フォームの表示・非表示を更新
    const form = document.getElementById('addItemForm');
    if (form) form.style.display = isEditMode ? "block" : "none";

    // 表示ループ
    store.items.forEach((item, index) => {
        // 表示用のテキスト例: "牛乳 : 198円 (1000ml)"
        const itemText = `${item.name} : ${item.price}円 (${item.amount}${item.unit})`;

        // 編集モード
        if (isEditMode) {
            listArea.innerHTML += `
                <div class="edit-item">
                    <span>${itemText}</span>
                    <div class="button-group">
                        <button class="Button" onclick="openItemModal(${index})">変更</button>
                        <button class="Button" onclick="openDeleteModal(${index})">削除</button>
                    </div>
                </div>
            `;
        // 通常モード
        } else {
            listArea.innerHTML += `
                <div class="view-item">
                    <span>${itemText}</span>
                </div>
            `;
        }
    });

    // 編集モードの時だけ「新規追加フォーム」を表示する
    document.getElementById('addItemForm').style.display = isEditMode ? 'flex' : 'none';

    saveData();
}
// 商品削除
function deleteItem(index) {
    // 1. 現在選んでいる店舗のデータを取得
    const store = stores.find(s => s.id === currentStoreId);

    // 2. 配列から削除！
    store.items.splice(index, 1);

    // 3. 重要：画面を更新して、削除後の状態を反映させる
    updateItemList();

    saveData();
}

// 編集モード切替
function toggleEditMode() {
    isEditMode = !isEditMode;
    const backBtn = document.getElementById('backBtn');
    
    // 編集モードなら隠す、そうでなければ出す
    document.getElementById('backBtn').style.display = isEditMode ? 'none' : 'inline-block';

    updateItemList(); // 全部こいつに任せる！
}

// 商品削除警告　開
function openDeleteModal(index) {
    const modal = document.getElementById('customModal');
    const confirmBtn = document.getElementById('modalConfirmBtn');
    
    // ダイアログを表示
    modal.style.display = 'flex';

    // 「削除する」ボタンが押された時の処理を上書き
    confirmBtn.onclick = function() {
        deleteItem(index); // 実際の削除処理を実行
        closeModal();      // ダイアログを閉じる
    };
    saveData();
}
// 商品削除警告　閉
function closeModal() {
    document.getElementById('customModal').style.display = 'none';
}

// 商品追加、変更ダイアログを開く（indexがnullなら追加、数値なら編集モード）
function openItemModal(index = null) {
    const modal = document.getElementById('itemModal');
    const title = document.getElementById('modalTitle');
    const submitBtn = document.getElementById('modalSubmitBtn');
    
    // 入力欄の取得
    const nameInput = document.getElementById('mItemName');
    const priceInput = document.getElementById('mItemPrice');
    const amountInput = document.getElementById('mItemAmount');
    const unitInput = document.getElementById('mItemUnit');

    if (index === null) {
        // 【追加モード】
        title.innerText = "商品を追加";
        nameInput.value = ""; priceInput.value = ""; amountInput.value = "";
        submitBtn.onclick = () => saveItem(null); 
    } else {
        // 【編集モード】既存のデータを入れる
        title.innerText = "商品を編集";
        const item = stores.find(s => s.id === currentStoreId).items[index];
        nameInput.value = item.name;
        priceInput.value = item.price;
        amountInput.value = item.amount;
        unitInput.value = item.unit;
        submitBtn.onclick = () => saveItem(index);
    }
    modal.style.display = 'flex';

    saveData();
}
// 商品追加・編集のダイアログを閉じる
function closeItemModal() {
    document.getElementById('itemModal').style.display = 'none';
}
// 商品追加・編集の保存処理
function saveItem(index) {
    // 1. 値を取得
    const name = document.getElementById('mItemName').value;
    const price = Number(document.getElementById('mItemPrice').value);
    const amount = Number(document.getElementById('mItemAmount').value);
    const unit = document.getElementById('mItemUnit').value;

    // エラー要素の取得
    const mError = document.getElementById('mError');
    // リセット
    mError.innerText = "";
    let hasError = false;

    // バリデーション
    if (name === "" || price <= 0 || amount <= 0) { mError.innerText = "※有効な値を入力してください"; hasError = true; }

    if (hasError) return;

    const store = stores.find(s => s.id === currentStoreId);

    if (index === null) {
        // push (追加)
        store.items.push({ name, price, amount, unit });
    } else {
        // 上書き (編集)
        store.items[index] = { name, price, amount, unit };
    }

    // フォームを空にして再描画
    document.getElementById('mItemName').value = "";
    document.getElementById('mItemPrice').value = "";
    document.getElementById('mItemAmount').value = "";
    document.getElementById('mItemUnit').value = "ml";

    updateItemList();
    closeItemModal();
    saveData();
}

// 店舗編集ダイアログを開く
function openShopEditModal() {
    const shopId = currentStoreId; 
    const shop = stores.find(s => s.id === shopId);
    // 1. ダイアログに今の店名をセット
    document.getElementById('editShopNameInput').value = shop.shopname;
    
    // 2. 「保存」ボタンの挙動をセット
    document.getElementById('shopSaveBtn').onclick = () => {
        shop.shopname = document.getElementById('editShopNameInput').value;
        updateShopList();
        goToStoreDetail(shopId); // 店名が変わったので商品一覧も更新
        closeShopEditModal();
    };

    // 3. 「削除」ボタンが押されたら、さらに「削除警告ダイアログ」を開くようにする
    document.getElementById('shopDeleteEntryBtn').onclick = () => {
        openShopDeleteConfirm(shopId);
        closeShopEditModal();
    };
    
    document.getElementById('shopModal').style.display = 'flex';
    saveData(); // LocalStorageに保存！
}
// 店舗編集ダイアログを閉じる
function closeShopEditModal() {
    document.getElementById('shopModal').style.display = 'none';
}
// 店舗削除警告を開く
function openShopDeleteConfirm(shopId) {
    const modal = document.getElementById('customModal');
    const confirmBtn = document.getElementById('shopDeleteConfirmBtn');

    // ダイアログを表示
    document.getElementById('shopDeleteModal').style.display = 'flex';

    // 「削除する」ボタンが押された時の処理を上書き
    confirmBtn.onclick = function() {
        deleteshop(shopId); // 実際の削除処理を実行
        closeShopDeleteModal(); // ダイアログを閉じる

        document.getElementById('inputPage').style.display = 'flex';   // 店舗一覧を隠す
        document.getElementById('shopList').style.display = 'flex';   // 店舗一覧を隠す
        document.getElementById('detailPage').style.display = 'none'; // 商品詳細ページを出す
        isEditMode = false; // 編集モードもリセットしておく
        document.getElementById('addItemForm').style.display = 'none';
    };
    saveData();
}
// 店舗削除警告を閉じる
function closeShopDeleteModal() {
    document.getElementById('shopDeleteModal').style.display = 'none';
}
// 店舗削除
function deleteshop(shopId) {
    // 1. 現在選んでいる店舗のデータを取得
    stores = stores.filter(s => s.id !== shopId);
    // 2. 配列から削除！
    stores.splice(shopId, 1);
    // 3. 重要：画面を更新して、削除後の状態を反映させる
    updateShopList();

    saveData(); // LocalStorageに保存！
}


// 店舗一覧へ戻る
function goBack(){
    document.getElementById('inputPage').style.display = 'flex';   // 店舗一覧を出す
    document.getElementById('shopList').style.display = 'flex';   // 店舗一覧を出す
    document.getElementById('detailPage').style.display = 'none'; // 商品詳細ページを隠す
}

// 検索結果
function searchProduct() {
    const query = document.getElementById('searchInput').value.trim();
    if (query === "") return;

    foundItems = []; // 初期化

    // 全店舗をループ（二重ループ）
    stores.forEach(store => {
        store.items.forEach(item => {
            if (item.name.includes(query)) {
                // 店舗名も一緒に保存しておくと便利
                foundItems.push({
                    ...item, // 商品データ（price, amount, unitなど）をコピー
                    shopName: store.shopname
                });
            }
        });
    });

    // 検索結果ページへ切り替え
    document.getElementById('inputPage').style.display = 'none';
    document.getElementById('shopList').style.display = 'none';
    document.getElementById('searchResultPage').style.display = 'flex';
    const errorElement = document.getElementById('shopError');
    errorElement.innerText = ""; // エラーもリセット

    // 表示関数を呼ぶ
    displaySearchResults();
}
// 検索結果の表示
function displaySearchResults() {
    const mode = document.getElementById('sortMode').value;
    const listArea = document.getElementById('searchResultList');
    listArea.innerHTML = "";

    // C++の std::sort みたいなもの
    foundItems.sort((a, b) => {
        if (mode === "simple") {
            return a.price - b.price; // 単純な値段順
        } else {
            // 単位あたりの単価で比較 (price / amount)
            return (a.price / a.amount) - (b.price / b.amount);  
        }
    });

    foundItems.forEach(item => {
        const unitPrice = (item.price / item.amount).toFixed(2); // 小数点第二位まで
    
        // 表示するメインのテキストをモードで切り替える
        let mainText = "";
        let subText = "";

        // 単純比較モード
        if (mode === "simple") {
            mainText = `${item.name} : ${item.price}円 (${item.amount}${item.unit})`;
            subText = `1${item.unit}あたり約${unitPrice}円`;
        } else {
            // 単位あたりモード
            mainText = `${item.name} : 1${item.unit}あたり約${unitPrice}円`;
            subText = `(合計金額: ${item.price}円 / 内容量: ${item.amount}${item.unit})`;
        }

        // 共通の枠組みに流し込む
        listArea.innerHTML += `
            <div style="border-bottom: 1px solid #93a8ac; padding: 10px;">
                <strong>${item.shopName}</strong><br>
                ${mainText}<br>
                <small style="color: #93a8ac;">${subText}</small>
            </div>
        `;
    });
    saveData();
}

// トップページへ
function goToInput() {
    document.getElementById('inputPage').style.display = 'flex';
    document.getElementById('shopList').style.display = 'flex';   // 店舗一覧を出す
    document.getElementById('searchResultPage').style.display = 'none';
}

// LocalStorageに保存する
function saveData() {
    // 1. オブジェクトを文字列に変換
    const jsonString = JSON.stringify(stores);
    // 2. "myPriceData" という名前で保存
    localStorage.setItem('myPriceData', jsonString);
    // 3. IDカウンター (num) も忘れずに保存！
    localStorage.setItem('myIDCounter', num.toString());
}

loadData(); // ページが読み込まれたときにデータを復元する