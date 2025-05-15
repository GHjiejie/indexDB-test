<template>
  <div class="customer-manager">
    <h1>TypeScript + Vue 3</h1>

    <div class="status">
      <span>网络状态: </span>
      <span :class="['status-indicator', isOnline ? 'online' : 'offline']">
        {{ isOnline ? "在线" : "离线" }}
      </span>
    </div>

    <div class="customer-form">
      <el-input
        v-model="newCustomer.name"
        placeholder="姓名"
        class="input-field"
      />
      <el-input
        v-model="newCustomer.email"
        placeholder="邮箱"
        class="input-field"
      />
      <el-input
        v-model="newCustomer.phone"
        placeholder="电话"
        class="input-field"
      />

      <el-button type="primary" @click="handleAddCustomer" :loading="isLoading">
        添加客户
      </el-button>

      <el-button @click="syncChanges" :disabled="!isOnline || isLoading">
        同步更改
      </el-button>
    </div>

    <div v-if="error" class="error-message">
      <el-alert :title="error.message" type="error" show-icon />
    </div>

    <el-table :data="customers" style="width: 100%" v-loading="isLoading">
      <el-table-column prop="name" label="姓名" width="180" />
      <el-table-column prop="email" label="邮箱" width="180" />
      <el-table-column prop="phone" label="电话" />
      <el-table-column label="操作" width="120">
        <template #default="scope">
          <el-button
            size="small"
            type="danger"
            @click="handleDeleteCustomer(scope.row.id!)"
          >
            删除
          </el-button>
        </template>
      </el-table-column>
    </el-table>
  </div>
</template>

<script lang="ts">
import { defineComponent, reactive, ref } from "vue";
import { useIndexedDB } from "@/composables/useIndexedDB";
import { ElMessage } from "element-plus";

export default defineComponent({
  name: "CustomerManager",

  setup() {
    const {
      customers,
      isLoading,
      error,
      isOnline,
      addCustomer,
      loadCustomers,
      deleteCustomer,
      syncPendingChanges,
    } = useIndexedDB();

    const newCustomer = reactive({
      name: "",
      email: "",
      phone: "",
    });

    const handleAddCustomer = async () => {
      if (!newCustomer.name || !newCustomer.email) {
        ElMessage.warning("请输入姓名和邮箱");
        return;
      }

      await addCustomer(newCustomer);
      Object.assign(newCustomer, {
        name: "",
        email: "",
        phone: "",
      });
      ElMessage.success("客户添加成功");
    };

    const handleDeleteCustomer = async (id: number) => {
      try {
        await deleteCustomer(id);
        ElMessage.success("客户删除成功");
      } catch {
        ElMessage.error("删除客户失败");
      }
    };

    const syncChanges = async () => {
      await syncPendingChanges();
      ElMessage.success("同步完成");
    };

    // 初始化加载数据
    loadCustomers();

    return {
      customers,
      isLoading,
      error,
      isOnline,
      newCustomer,
      handleAddCustomer,
      handleDeleteCustomer,
      syncChanges,
    };
  },
});
</script>

<style scoped>
.customer-manager {
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
}

.status {
  margin: 20px 0;
  font-size: 16px;
}

.status-indicator {
  padding: 2px 8px;
  border-radius: 4px;
  color: white;
}

.status-indicator.online {
  background-color: #67c23a;
}

.status-indicator.offline {
  background-color: #f56c6c;
}

.customer-form {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-bottom: 20px;
}

.input-field {
  flex: 1;
  min-width: 200px;
}

.error-message {
  margin-bottom: 20px;
}
</style>
