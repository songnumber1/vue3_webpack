<template>
  <div class="file-manager-wrapper">
    <div class="file-manager">
      <!-- 상단 컨트롤 -->
      <div class="controls">
        <div class="search-box">
          <input
            class="search-input"
            v-model="searchQuery"
            placeholder="파일 이름을 입력하세요."
          />
          <button class="action-btn" @click="searchFiles">검색</button>
        </div>
        <div class="action-buttons">
          <button class="action-btn" @click="$refs.fileInput.click()">
            업로드
          </button>
          <button
            class="action-btn"
            @click="startDownload"
            :disabled="!hasCheckedFiles || isDownloading"
          >
            다운로드
          </button>
          <input
            ref="fileInput"
            type="file"
            @change="handleUploadFile"
            style="display: none"
          />
        </div>
      </div>

      <!-- 파일 목록 테이블 -->
      <table class="file-table">
        <thead>
          <tr>
            <th class="file-check">
              <input type="checkbox" @change="toggleAll" v-model="selectAll" />
            </th>
            <th class="file-name-col">파일 이름</th>
            <th>상태</th>
            <th>크기</th>
            <th>타입</th>
            <th>업로드 시간</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(file, index) in paginatedFiles" :key="file.id">
            <td><input type="checkbox" v-model="file.checked" /></td>
            <td>
              <div class="filename-tooltip" :title="file.name">
                {{ file.name }}
              </div>
            </td>
            <td>
              <span v-if="file.status === '업로드 중'">업로드 중</span>
              <span v-else-if="file.status === '업로드 완료'">업로드 완료</span>
              <span v-else-if="file.status === '다운로드 중'"
                >다운로드 중 {{ file.downloadProgress }}%</span
              >
              <span v-else-if="file.status === '다운로드 완료'"
                >다운로드 완료</span
              >
              <span v-else>{{ file.status }}</span>
            </td>
            <td>{{ formatSize(file.size) }}</td>
            <td>{{ file.type }}</td>
            <td>{{ file.uploadTime }}</td>
          </tr>
        </tbody>
      </table>

      <!-- 페이징 버튼 (1~10씩 묶음) -->
      <div class="pagination">
        <button @click="prevPageGroup" :disabled="pageGroup === 0">이전</button>
        <button
          v-for="page in pageNumbers"
          :key="page"
          @click="currentPage = page"
          :class="{active: currentPage === page}"
        >
          {{ page }}
        </button>
        <button
          @click="nextPageGroup"
          :disabled="(pageGroup + 1) * 10 >= totalPages"
        >
          다음
        </button>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  data() {
    return {
      selectedFile: null,
      files: [],
      searchQuery: "",
      filteredFiles: [],
      currentPage: 1,
      perPage: 10,
      selectAll: false,
      isDownloading: false,
      downloadQueue: [],
      currentDownloadIndex: 0,
      xhr: null,
    };
  },
  computed: {
    totalPages() {
      return Math.ceil(this.filteredFiles.length / this.perPage);
    },
    paginatedFiles() {
      const start = (this.currentPage - 1) * this.perPage;
      return this.filteredFiles.slice(start, start + this.perPage);
    },
    pageGroup() {
      return Math.floor((this.currentPage - 1) / 10);
    },
    pageNumbers() {
      const start = this.pageGroup * 10 + 1;
      return Array.from({length: 10}, (_, i) => start + i).filter(
        (p) => p <= this.totalPages
      );
    },
    hasCheckedFiles() {
      return this.files.some((f) => f.checked);
    },
  },
  methods: {
    handleUploadFile(e) {
      this.selectedFile = e.target.files[0];
      this.uploadFile();
    },
    uploadFile() {
      const file = this.selectedFile;
      if (!file) return;

      const reader = new FileReader();
      reader.onload = () => {
        const newFile = {
          id: Date.now(),
          name: file.name,
          size: file.size,
          type: file.type,
          progress: 0,
          status: "업로드 중",
          downloadProgress: 0,
          checked: false,
          uploadTime: new Date().toLocaleString(),
        };

        this.files.unshift(newFile);
        this.searchFiles();

        const interval = setInterval(() => {
          if (newFile.progress >= 100) {
            newFile.progress = 100;
            newFile.status = "업로드 완료";
            clearInterval(interval);
          } else {
            newFile.progress += Math.floor(Math.random() * 10) + 1;
            if (newFile.progress > 100) newFile.progress = 100;
          }
        }, 200);
      };
      reader.readAsArrayBuffer(file);
    },
    searchFiles() {
      if (this.searchQuery) {
        this.filteredFiles = this.files.filter((file) =>
          file.name.toLowerCase().includes(this.searchQuery.toLowerCase())
        );
      } else {
        this.filteredFiles = [...this.files];
      }
      this.currentPage = 1;
    },
    toggleAll() {
      this.paginatedFiles.forEach((file) => (file.checked = this.selectAll));
    },
    formatSize(size) {
      const kb = size / 1024;
      return kb > 1024 ? `${(kb / 1024).toFixed(2)} MB` : `${kb.toFixed(2)} KB`;
    },
    generateMockData() {
      const types = ["image/png", "application/pdf", "text/plain"];
      for (let i = 0; i < 300; i++) {
        this.files.push({
          id: i + 1,
          name: `file_${i + 1}.txt`,
          size: Math.floor(Math.random() * 10000000),
          type: types[i % 3],
          progress: 100,
          downloadProgress: 0,
          status: "업로드 완료",
          checked: false,
          uploadTime: new Date(Date.now() - i * 3600000).toLocaleString(),
        });
      }
      this.searchFiles();
    },
    prevPageGroup() {
      if (this.pageGroup > 0) {
        this.currentPage = (this.pageGroup - 1) * 10 + 1;
      }
    },
    nextPageGroup() {
      if ((this.pageGroup + 1) * 10 < this.totalPages) {
        this.currentPage = (this.pageGroup + 1) * 10 + 1;
      }
    },
    async startDownload() {
      this.downloadQueue = this.files.filter((f) => f.checked);
      this.isDownloading = true;
      this.currentDownloadIndex = 0;
      this.downloadNext();
    },
    async downloadNext() {
      if (this.currentDownloadIndex >= this.downloadQueue.length) {
        this.isDownloading = false;
        return;
      }

      const file = this.downloadQueue[this.currentDownloadIndex];
      file.status = "다운로드 중";
      file.downloadProgress = 0;

      this.xhr = new XMLHttpRequest();
      this.xhr.responseType = "blob";

      this.xhr.onprogress = (e) => {
        if (e.lengthComputable) {
          file.downloadProgress = Math.round((e.loaded / e.total) * 100);
        }
      };

      this.xhr.onload = () => {
        const blob = this.xhr.response;
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = file.name;
        a.click();
        URL.revokeObjectURL(url);
        file.status = "다운로드 완료";
        this.currentDownloadIndex++;
        this.downloadNext();
      };

      this.xhr.onerror = () => {
        alert("다운로드 오류");
        file.status = "다운로드 실패";
        this.isDownloading = false;
      };

      this.xhr.open("GET", `/downloads/${file.name}`);
      this.xhr.send();
    },
    cancelDownload() {
      if (this.xhr) {
        this.xhr.abort();
        this.isDownloading = false;
        this.downloadQueue[this.currentDownloadIndex].status = "다운로드 취소";
      }
    },
  },
  mounted() {
    this.generateMockData();
  },
};
</script>

<style scoped>
.file-manager-wrapper {
  display: flex;
  justify-content: center;
  width: 100vw;
}

.file-manager {
  width: 70%;
  margin: 2rem auto;
  padding: 1rem;
  font-family: Arial, sans-serif;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.controls {
  width: 100%;
  display: flex;
  justify-content: space-between;
  margin-bottom: 1rem;
  align-items: center;
}

.search-box {
  display: flex;
  gap: 0.5rem;
}

.search-input {
  border: 1px solid gray;
  padding: 5px;
  min-width: 500px;
}

.action-buttons {
  display: flex;
  gap: 0.5rem;
}

.action-btn {
  padding: 0.4rem 0.8rem;
  border: 1px solid #ccc;
  background-color: #fff;
  cursor: pointer;
  transition: background-color 0.2s;
}
.action-btn:hover {
  background-color: #f0f0f0;
}

.file-table {
  width: 100%;
  border-collapse: collapse;
  table-layout: fixed;
}
.file-table th,
.file-table td {
  padding: 0.5rem;
  border: 1px solid #ddd;
  text-align: center;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}
.file-table th {
  background-color: #f4f4f4;
}
.file-check {
  width: 40px;
}
.file-name-col {
  width: 30%;
}
.filename-tooltip {
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
  display: block;
}

.pagination {
  margin-top: 1rem;
  display: flex;
  justify-content: center;
  gap: 0.5rem;
}
.pagination button.active {
  font-weight: bold;
  text-decoration: underline;
}
</style>
