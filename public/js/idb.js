let db;

const request = indexedDB.open('budget-tracker', 1);

request.onupgradeneeded = function (event) {
  const db = event.target.result;
  db.createObjectStore('transactions', { autoIncrement: true });
};

request.onsuccess = function (event) {
  db = event.target.result;

  if (navigator.onLine) {
    uploadTransaction();
  }
};

request.onerror = function (event) {
  // log error here
  console.error(event.target.errorCode);
};

function saveRecord(record) {
  const transaction = db.transaction(['transactions'], 'readwrite');
  const transactionObjectStore = transaction.objectStore('transactions');
  transactionObjectStore.add(record);
}

function uploadTransaction() {
  // open a transaction on your db
  const transaction = db.transaction(['transactions'], 'readwrite');

  // access your object store
  const transactionObjectStore = transaction.objectStore('transactions');
  const getAll = transactionObjectStore.getAll();

  getAll.onsuccess = () => {
    if (getAll.result.length > 0) {
      fetch('/api/transaction/bulk', {
        method: 'POST',
        body: JSON.stringify(getAll.result),
        headers: {
          Accept: 'application/json, text/plain, */*',
          'Content-Type': 'application/json'
        }
      })
        .then(response => response.json())
        .then(serverResponse => {
          if (serverResponse.message) {
            throw new Error(serverResponse);
          }
          // open one more transaction
          const transaction = db.transaction(['transactions'], 'readwrite');
          // access the new_pizza object store
          const transactionObjectStore = transaction.objectStore('transactions');
          // clear all items in your store
          transactionObjectStore.clear();
        })
        .catch(err => {
          console.error(err);
        });
    }
  }
};

window.addEventListener('online', uploadTransaction);