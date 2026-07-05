// 지금 대략적인 코드야 지금 사용하지 않고 있는 코드도 있고 제일 중요한거는 chatResponse에서 넘어것을 이용해서
렌더링이 변경되고 있어 아래 코드 상세히 확인해서 더 필요한게 있는지 확인해줘 feedback 관련 함수나 로직은 일단
무시하고 우리가 만든게 있으니 그걸 확인하면 될거 같거든
<template>
    <div v-if="respObj.role === 'assistant'" class="chat-bubble-ai">
        <div class="conts" :msg-id="respObjId">
            <div :id="'resp' + respObj.id" class="chat-text-box">
                <div v-if="!$root.gfnIsNull(respObj.reasoningContent)" class="think-wrap">
                    <div class="think-tag-header" :class="{ 'loading-shine': isReasoningLoading && respObj.id !== 1 }"
                        @click="hideStatus">
                        <i class="toggle-arrow" :class="[!isHidden ? '' : 'floded']"></i>
                        <span class="text">{{ reasoningStatusTextIInfo }}</span>
                    </div>

                    <markdown-viewer v-if="!isHidden" :content="respObj.reasoningContent" :id="'md_reason_' + respIdx"
                        :is-reasoning="true" :resp-obj-id="respObjId" />
                </div>

                <markdown-viewer :content="respObj.content" :id="'md_' + respIdx" :is-reasoning="false"
                    :resp-obj-id="respObjId" />
            </div>

            <div v-if="!$root.gfnIsNull(respObj.console.warnType)" class="caution-box">
                <span class="icon-caution">
                    경고가 발생했습니다.
                </span>
            </div>
        </div>

        <div v-if="respObj.id !== 1" class="chat-feedback">
            <div class="re-action-box">
                <template v-if="!selectedAssistantInfo.privateYN && !requiredInfo.isSharedChat">
                    <ul class="re-action-list">
                        <li>
                            <button type="button" class="basic-btn icon large"
                                :class="{ 'on': currentFeedbackScore === 1 }" @click="setFeedbackScore(true)">
                                <i class="icon-reaction20_like"></i>
                            </button>
                        </li>
                        <li>
                            <button type="button" class="basic-btn icon large"
                                :class="{ 'on': currentFeedbackScore === -1 }" @click="setFeedbackScore(false)">
                                <i class="icon-reaction20_dislike"></i>
                            </button>
                        </li>
                    </ul>
                    <button type="button" class="basic-btn large"
                        @click.stop="requiredInfo.registerFeedbackContent(respObj.id)">
                        피드백 보내기
                    </button>
                </template>

                <div class="icon-btns">
                    <div>
                        <button class="basic-btn icon-only large"
                            @click="requiredInfo.copy(respObj.content, '답변이 복사되었습니다.')">
                            <i class="icon-setChat-copy"></i>
                            <span>클립보드 복사</span>
                        </button>
                    </div>

                    <div v-if="usableGeneration && requiredInfo.isActivedRegen">
                        <button class="basic-btn icon-only large" @click="requiredInfo.reGeneration()">
                            <i class="icon-setChat-regen"></i>
                            <span>답변 재생성 버튼</span>
                        </button>
                    </div>

                    <div v-if="usableGeneration && requiredInfo.isActivedContinue">
                        <button class="basic-btn icon-only large" @click="requiredInfo.continueGeneration()">
                            <i class="icon-setChat-start"></i>
                            <span>계속 작성 버튼</span>
                        </button>
                    </div>
                </div>
            </div>
        </div>

        <div v-if="isActivateChatFooter" class="chat-footer-wrap">
            <div class="chat-footer">
                <div><!-- 출처 컴포넌트 이거는 내가 만들었어 --></div>
                <div><!-- 이미지 컴포넌트 이거는 내가 만들었어 --></div>
                <div><!-- duo 컴포넌트 이거는 내가 만들었어 --></div>
            </div>
        </div>
    </div>

    <div v-else-if="respObje.role === 'response'" id="waitingResponse" class="chat-bubble-ai">
        <div class="conts">
            <div class="chat-tet-box">
                <div class="think-tag-haeder loading-shine" :style="watingCursorStatus" @click="hideStatus()">
                    <i v-if="isReasoningModel" class="toogle-arrow" :class="[!isHidden ? '' : 'floded']"></i>
                    <span v-if="isReasoningModel" class="text">
                        생각하는 중입니다.
                    </span>

                    <span v-else class="text">
                        답변 중입니다.
                    </span>
                </div>
            </div>
        </div>
    </div>

    <template v-else>
        <div class="err-box">
            <p>
                <span class="icon-err">
                    {{ respObj.content.split("\n\n")[0] }}
                </span>
            </p>
        </div>
        <div v-if="usableGeneration && requiredInfo.isActivedReGen" class="chat-feedback">
            <div class="re-action-box">
                <div class="icon-btns">
                    <div>
                        <button class="basic-btn icon-only large" @click="requiredInfo.reGeneration()">
                            <i class="icon-setChat-regen"></i>
                            <span>답변 재생성 버튼</span>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    </template>
</template>

<script>
// 컴포넌트는 제외했어
import { FEEDBACK_ACTIONS } from '@/constants/feedback';
import { unwrapApiBody } from '@/utils/apiResponseReader';
import { computed } from 'vue';
import { mapState } from 'vuex';

export default {
    name: "ChatResponse",
    props: {
        requiredInfo: { type: Object }
    },
    component: {},// 컴포넌트는 제외했어
    computed: {
        ...mapState("chat", ["selectedChatId", "selectedAssistInfo", "selectedModelInfo", "feedbackList"]),
        waitingCursorStatus() {
            if (this.isReasoningModel) {
                return "";
            }

            return "cursor:default;"
        },
        userObj() {
            return this.requiredInfo.userObj
        },
        respIdx() {
            return this.requiredInfo.respIdx;
        },
        lastIdx() {
            return this.requiredInfo.lastIdx
        },
        respObj() {
            return this.requiredInfo.chatCompletions[this.respIdx];
        },
        respObjId() {
            return this.respObj.id !== 1;
        },
        isReasoningModel() {
            return this.requiredInfo.isReasoningModel;
        },
        isNullFeedbackType() {
            // gfnIsNull은 app.vue의 함수이고 return val === null || val === undefined || val === "" 이거야
            return this.$root.gfnIsNull(this.respObj.feedbackType);
        },
        currentFeedbackScore() {
            if (this.isActivateFeedback) {
                return -1
            }

            if (this.feedbackInfo === null) return 0;

            return this.feedbackInfo.setFeedbackScore;
        },
        displayedFeedbackList() {
            return this.exampleFeedbackList;
        },
        exampleFeedbackList() {
            if (this.isDefaultFeedback) {
                return this.feedbackList.filter(o => o.default)
            }

            return this.feedbackList;
        },
        feedbackType() {
            if (this.isNullFeedbackType) return null;

            const feedbackScore = this.respObj.feedback;

            if (feedbackScore >= 1 && feedbackScore <= 6) {
                return "A";
            } else if (feedbackScore >= 7 && feedbackScore <= 8) {
                return "B"
            }
            return "C"
        },
        isReasoningLoading() {
            return (this.$root.gfnIsNull(this.respObj.stopReason) && this.$root.gfnIsNull(this.respObj.content));
        },
        reasoningStatusTextIInfo() {
            const statusInfo = {};

            if (this.isReasoning) {
                if (this.isLast) {
                    statusInfo.ko = "완료되었습니다.";
                    statusInfo.en = "Complete"
                } else {
                    statusInfo.ko = "생각하는 중입니다.";
                    statusInfo.en = "Thinking"
                }
            } else if (!this.$root.gfnIsNull(this.respObj.reasoningContent)) {
                if (this.$root.gfnIsNull(this.respObj.content)) {
                    statusInfo.ko = "답변 중입니다.";
                    statusInfo.en = "Answering"
                } else {
                    statusInfo.ko = "완료되었습니다.";
                    statusInfo.en = "Complete"
                }
            }

            return statusInfo;
        },
        isActivateChatFooter() {
            // 이부분은 내가 확인할게
            // 출처 정보 있는지,
            //     이미지 정보 있는지,
            // duo 정보 있는지
        },
        usableGeneration() {
            if (!this.requiredInfo.isActivateRequest) {
                return false;
            }

            if (this.respIdx !== this.lastIdx) { return false }

            return true;
        }
    },
    watch: {
        respObj() {
            this.getImage();
            this.getMessageFeedback();
        },
        isActivateFeedback(newVal) {
            if (newVal) return;

            this.isDefaultFeedback = true;
        }
    },
    data() {
        return {
            observer: null,
            mdHeight: {},
            isHidden: true,
            isActivateFeedback: false,
            isDefaultFeedback: true,
            feedbackInfo: null
        }
    },
    created() {
        this.getImage();
        this.getMessageFeedback();
    },
    mounted() {
        this.observer = new ResizeObserver((entries) => {
            for (let entry of entries) {
                const el = entry.target;
                const { top, bottom } = el.getBoundingClientRect();

                this.mdHeight[el.id] = bottom - top;
            }
        })

        const md_file = document.getElementById("md_file_" + this.respIdx);

        if (!this.$root.gfnIsNull(md_file)) {
            this.mdHeight[md_file.id] = 0;
            this.observer.observe();
        }
    },
    methods: {
        getMessageFeedback() {
            if (this.$root.gfnIsNull(this.respObjId) || this.respObjId === 1) {
                return;
            }

            const callbackTranFunc = (callBackRes, isSuccess) => {
                const result = callBackRes["result"];
                const res = result["res"];

                if (!isSuccess) {
                    this.isActivateFeedback = false;
                    const alertMsg = callBackRes.message;
                    alert(alertMsg);
                    return;
                }

                let feedbackInfo = null
                try {
                    feedbackInfo = JSON.parse(res);
                } catch {
                    feedbackInfo = null;
                }

                this.updateFeedbackInfo(feedbackInfo);
            }

            // controller 이부분 추가해서 필요하면 종료 시켜줘
            this.$root.gfnTransaction({
                url: "message-feedback-history/info.do?msgId=" + this.respObjId,
                methood: "GET",
                body: null,
                isResJson: false,
                callBackInfo: {
                    tranId: "getMessageFeedback",
                    func: callbackTranFunc,
                    param: null
                },
                controller: null
            })
        },
        setFeedbackScore(isLike) {
            const orgIsActivateFeedback = this.isActivateFeedback;
            let feedbackScore;
            let isActivateFeedback;

            if (isLike) {
                feedbackScore = 1;
                isActivateFeedback = false;
            } else {
                feedbackScore = -1;
                isActivateFeedback = !orgIsActivateFeedback;
            }

            this.isActivateFeedback = isActivateFeedback;
            this.updateFeedback(this.getFeedbackInfo(feedbackScore), orgIsActivateFeedback);
            this.scrollDislikeFeedback();
        },
        scrollDislikeFeedback() {
            this.$nextTick(() => {
                this.$refs.scrollTarget?.scrollIntoView({
                    behavior: 'smooth',
                    block: 'end'
                })
            });
        },
        setFeedbackContent(feedbackInfo) {
            const orgIsActivateFeedback = this.isActivateFeedback;
            this.isActivateFeedback = false;
            this.registerFeedback(this.getFeedbackInfo(-1, feedbackInfo), orgIsActivateFeedback);
        },
        updateFeedback(feedbackInfo, orgIsActivateFeedback) {
            if (this.feedbackInfo === null || this.feedbackInfo.feddbackScore !== feedbackInfo.feedbackScore) {
                this.registerFeedback(feedbackInfo, orgIsActivateFeedback);
                return;
            }

            this.deleteFeedback(this.respObjId, orgIsActivateFeedback);
        },
        registerFeedback(feedbackInfo, orgIsActivateFeedback) {
            const feedbackScore = feedbackInfo.feedbackScore;

            const feedback = {
                msgId: this.respObjId,
                feddbackScore: feddbackScore,
                feedbackType: "Hallucination",
                feedbackContent: null,
            }

            // ...
        },
        hideStatus() {
            if (!this.isReasoningModel) {
                return;
            }

            this.isHidden = !this.isHidden;
        }
    }
}
</script>