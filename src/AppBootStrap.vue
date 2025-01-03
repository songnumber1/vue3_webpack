<template>
    <div class="d-flex flex-column h-100">
        <!-- Header -->
        <header class="bg-primary text-white p-3">
            <button class="btn btn-light me-3 bg-primary" @click="toggleMenu">
            <!-- {{ isMenuOpen ? "Close Menu" : "Open Menu" }} -->
            <i :class="isMenuOpen ? 'bi bi-chevron-right' : 'bi bi-chevron-left'"></i>
            </button>
            <h5 class="d-inline">Chat Application</h5>
        </header>

        <!-- Main Content -->
        <div class="d-flex flex-grow-1">
            <!-- Left Menu -->
            <div v-if="isMenuOpen" class="bg-light p-3" style="width: 250px;">
            <ul class="list-unstyled">
                <li><a href="#" class="text-decoration-none">Menu Item 1</a></li>
                <li><a href="#" class="text-decoration-none">Menu Item 2</a></li>
                <li><a href="#" class="text-decoration-none">Menu Item 3</a></li>
            </ul>
            </div>

            <!-- Chat Body -->
            <div class="content-area flex-grow-1 d-flex overflow-auto">
                <!-- Left Panel -->
                <div class="left-panel flex-grow-1">
                    <div class="chat-body p-3">
                        <div v-for="(message, index) in chatMessages" :key="index">
                            <chat-message :message="message"></chat-message>
                        </div>
                    </div>
                    <div class="p-3 bg-light">
                        <div class="input-group">
                        <input
                            type="text"
                            class="form-control"
                            placeholder="Type a message..."
                            v-model="newMessage"
                            @keyup.enter="sendMessage"
                        />
                        <button class="btn btn-primary" @click="sendMessage">Send</button>
                        </div>
                    </div>                    
                </div>

                <!-- Right Panel -->
                <div class="right-panel flex-shrink-0" style="width: 350px;">
                    <div class="p-3">
                    <h6>Right Panel</h6>
                    <p>Content for the right panel.</p>
                    </div>
                </div>
            </div>
        </div>

        <!-- Footer -->
        <footer class="bg-secondary text-white p-3 text-center">
            Footer Content
        </footer>
    </div>
</template>

<script>
import ChatMessage from './components/ChatMessage.vue';
export default {
    name: "App",
    components: {ChatMessage},
    data() {
        return {
            isMenuOpen: true, // 왼쪽 메뉴 열림/닫힘 상태
            chatMessages: [], // 채팅 메시지
            newMessage: ""    // 새로운 메시지 입력
        };
    },
    methods: {
        toggleMenu() {
            this.isMenuOpen = !this.isMenuOpen;
        },
        sendMessage() {
            if (this.newMessage.trim()) {
                this.chatMessages.push({ text: this.newMessage, time: new Date().toLocaleTimeString() });
                this.newMessage = "";
            }
        }
    }
}
</script>

<style>
    .content-area {
      height: calc(100vh - 130px);
    }

    .chat-body {
      height: calc(100% - 70px);
      overflow-y: auto;
      background-color: red;
    }
    .left-menu {
      width: 250px;
      transition: all 0.3s ease;
    }
    .left-menu.collapsed {
      width: 0;
      overflow: hidden;
    }

    .left-panel {
      background-color: #f8f9fa;
    }
    .right-panel {
      background-color: #e9ecef;
    }
</style>