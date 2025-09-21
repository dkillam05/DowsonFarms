<!-- /js/fb-data.js -->
<script type="module">
import {
  collection, doc, addDoc, setDoc, deleteDoc, getDocs,
  serverTimestamp, query, orderBy
} from "https://www.gstatic.com/firebasejs/10.13.1/firebase-firestore.js";

if (!window.DF_FB?.db) throw new Error("Load /js/firebase.js first.");
const { db } = window.DF_FB;

/** Simple CRUD helpers by collection name */
const DB = {
  async list(colName, { order = [] } = {}) {
    const col = collection(db, colName);
    const q   = order.length ? query(col, ...order.map(f => orderBy(f))) : col;
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  },
  async upsert(colName, data) {
    const col = collection(db, colName);
    if (data.id) {
      await setDoc(doc(col, data.id), { ...data, updatedAt: serverTimestamp() }, { merge:true });
      return data.id;
    } else {
      const ref = await addDoc(col, { ...data, createdAt: serverTimestamp(), updatedAt: serverTimestamp() });
      return ref.id;
    }
  },
  async remove(colName, id) {
    await deleteDoc(doc(collection(db, colName), id));
  }
};

// Expose
window.DF_DB = DB;
</script>
