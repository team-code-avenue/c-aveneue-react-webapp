import { combineReducers } from "redux";
import { configureStore } from "@reduxjs/toolkit";

import todoReducer from 'reducer/todo';
import authReducer from 'reducer/auth';
import meetingReducer from 'reducer/meeting';

const store = configureStore({
  reducer: combineReducers({
    todo: todoReducer,
    auth: authReducer,
    meeting: meetingReducer
  })
});

export default store;
