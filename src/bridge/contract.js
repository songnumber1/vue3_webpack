import {GetUserRequest, GetUserResponse} from "./schemas/getUser";
import {LoginRequest, LoginResponse} from "./schemas/login";
import {UploadFileRequest, UploadFileResponse} from "./schemas/uploadFile";
import {BaseResponseError} from "./schemas/base";

export const BridgeContract = {
  GET_USER: {
    request: GetUserRequest,
    response: GetUserResponse,
    error: BaseResponseError,
    description: "유저 조회",
    tag: "User",
  },

  LOGIN: {
    request: LoginRequest,
    response: LoginResponse,
    error: BaseResponseError,
    description: "로그인",
    tag: "Auth",
  },

  UPLOAD_FILE: {
    request: UploadFileRequest,
    response: UploadFileResponse,
    error: BaseResponseError,
    description: "파일 업로드",
    tag: "File",
  },
};
