// src/composables/useIndexedDB.ts
import { ref, onMounted } from "vue";
import { IndexedDBUtil } from "@/utils/IndexedDBUtil";

interface Customer {
  id?: number;
  name: string;
  email: string;
  phone?: string;
}

export function useIndexedDB() {
  const dbUtil = ref<IndexedDBUtil | null>(null);
  const customers = ref<Customer[]>([]);
  const isLoading = ref(false);
  const error = ref<Error | null>(null);
  const isOnline = ref(navigator.onLine);

  const initDB = async () => {
    try {
      isLoading.value = true;
      dbUtil.value = new IndexedDBUtil("CustomerDB", 1);
      await dbUtil.value.openDB([
        {
          name: "customers",
          keyPath: "id",
          indexes: [
            { name: "name", keyPath: "name", unique: false },
            { name: "email", keyPath: "email", unique: true },
          ],
        },
        {
          name: "pendingSync",
          keyPath: "timestamp",
        },
      ]);
    } catch (err) {
      error.value = err as Error;
      console.error("初始化数据库失败:", err);
    } finally {
      isLoading.value = false;
    }
  };

  const addCustomer = async (customer: Omit<Customer, "id">) => {
    if (!dbUtil.value) await initDB();

    try {
      isLoading.value = true;
      const newCustomer = {
        ...customer,
        id: Date.now(),
      };

      await dbUtil.value!.addItem("customers", newCustomer);
      customers.value.push(newCustomer);

      if (!isOnline.value) {
        await dbUtil.value!.addItem("pendingSync", {
          type: "addCustomer",
          data: newCustomer,
          timestamp: Date.now(),
        });
      } else {
        // 这里可以添加实际的API调用
        console.log("模拟网络请求: 添加客户", newCustomer);
      }
    } catch (err) {
      error.value = err as Error;
      console.error("添加客户失败:", err);
    } finally {
      isLoading.value = false;
    }
  };

  const loadCustomers = async () => {
    if (!dbUtil.value) await initDB();

    try {
      isLoading.value = true;
      customers.value = await dbUtil.value!.getAllItems<Customer>("customers");
    } catch (err) {
      error.value = err as Error;
      console.error("加载客户列表失败:", err);
    } finally {
      isLoading.value = false;
    }
  };

  const deleteCustomer = async (id: number) => {
    if (!dbUtil.value) await initDB();

    try {
      isLoading.value = true;
      await dbUtil.value!.deleteItem("customers", id);
      customers.value = customers.value.filter((c) => c.id !== id);

      if (!isOnline.value) {
        await dbUtil.value!.addItem("pendingSync", {
          type: "deleteCustomer",
          data: { id },
          timestamp: Date.now(),
        });
      } else {
        // 这里可以添加实际的API调用
        console.log("模拟网络请求: 删除客户", id);
      }
    } catch (err) {
      error.value = err as Error;
      console.error("删除客户失败:", err);
    } finally {
      isLoading.value = false;
    }
  };

  const syncPendingChanges = async () => {
    if (!dbUtil.value || !isOnline.value) return;

    try {
      isLoading.value = true;
      const pendingChanges = await dbUtil.value.getAllItems<{
        type: string;
        data: any;
        timestamp: number;
      }>("pendingSync");

      for (const change of pendingChanges) {
        switch (change.type) {
          case "addCustomer":
            // 模拟API调用
            console.log("同步: 添加客户", change.data);
            break;
          case "deleteCustomer":
            // 模拟API调用
            console.log("同步: 删除客户", change.data.id);
            break;
        }

        await dbUtil.value.deleteItem("pendingSync", change.timestamp);
      }

      await loadCustomers();
    } catch (err) {
      error.value = err as Error;
      console.error("同步失败:", err);
    } finally {
      isLoading.value = false;
    }
  };

  // 监听网络状态变化
  onMounted(() => {
    window.addEventListener("online", () => {
      isOnline.value = true;
      syncPendingChanges();
    });
    window.addEventListener("offline", () => {
      isOnline.value = false;
    });
  });

  return {
    dbUtil,
    customers,
    isLoading,
    error,
    isOnline,
    initDB,
    addCustomer,
    loadCustomers,
    deleteCustomer,
    syncPendingChanges,
  };
}
