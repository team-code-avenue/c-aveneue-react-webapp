import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  url: "",
  loading: false,
  error: false
};

const slice = createSlice({
  name: "timeline",
  initialState,
  reducers: {
    fetchStart: state => {
      return Object.assign({}, state, { url: "", loading: true });
    },
    fetchSucceed: (state, action) => {
      return Object.assign({}, state, { url: action.payload, loading: false });
    },
    fetchFaild: (state, action) => {
      console.error(action.payload);
      return Object.assign({}, state, { loading: false, error: true });
    },
    clear: () => {
      return { url: "", loading: false, error: false };
    }
  }
});

export default slice.reducer;
export const { clear } = slice.actions;
