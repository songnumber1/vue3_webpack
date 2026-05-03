import {GetUserRequest, GetUserResponse} from "./schemas/getUser";
import {LoginRequest, LoginResponse} from "./schemas/login";
import {UploadFileRequest, UploadFileResponse} from "./schemas/uploadFile";

export const BridgeContract = {
  GET_USER: {
    request: GetUserRequest,
    response: GetUserResponse,
    description: "유저 조회",
    tag: "User",
  },

  LOGIN: {
    request: LoginRequest,
    response: LoginResponse,
    description: "로그인",
    tag: "Auth",
  },

  UPLOAD_FILE: {
    request: UploadFileRequest,
    response: UploadFileResponse,
    description: "파일 업로드",
    tag: "File",
  },
};
