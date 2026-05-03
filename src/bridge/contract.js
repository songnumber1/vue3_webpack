// src/bridge/contract.js
import {GetUserRequest, GetUserResponse} from "./schemas/getUser";

export const BridgeContract = {
  GET_USER: {
    request: GetUserRequest,
    response: GetUserResponse,
    description: "유저 조회",
  },
};
