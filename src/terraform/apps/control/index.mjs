import http from "http";
import https from "https";
import fs from "fs";
import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);
const PORT = 8080;
const IS_PRODUCTION = process.env.NODE_ENV === "production";

// --- ADMIN GUI HTML ---
const ADMIN_GUI_HTML = atob(`PCFET0NUWVBFIGh0bWw+CjxodG1sIGxhbmc9ImVuIj4KPGhlYWQ+CiAgICA8bWV0YSBjaGFyc2V0PSJVVEYtOCI+CiAgICA8bWV0YSBuYW1lPSJ2aWV3cG9ydCIgY29udGVudD0id2lkdGg9ZGV2aWNlLXdpZHRoLCBpbml0aWFsLXNjYWxlPTEuMCI+CiAgICA8dGl0bGU+SW52b2ljaW5nIEFkbWluPC90aXRsZT4KICAgIDxsaW5rIHJlbD0ic3R5bGVzaGVldCIgaHJlZj0iaHR0cHM6Ly9mb250cy5nb29nbGVhcGlzLmNvbS9jc3M/ZmFtaWx5PVJvYm90bzozMDAsNDAwLDUwMCw3MDAmZGlzcGxheT1zd2FwIiAvPgogICAgCiAgICA8c2NyaXB0IHNyYz0iaHR0cHM6Ly91bnBrZy5jb20vcmVhY3RAMTgvdW1kL3JlYWN0LnByb2R1Y3Rpb24ubWluLmpzIj48L3NjcmlwdD4KICAgIDxzY3JpcHQgc3JjPSJodHRwczovL3VucGtnLmNvbS9yZWFjdC1kb21AMTgvdW1kL3JlYWN0LWRvbS5wcm9kdWN0aW9uLm1pbi5qcyI+PC9zY3JpcHQ+CiAgICA8c2NyaXB0IHNyYz0iaHR0cHM6Ly91bnBrZy5jb20vQGVtb3Rpb24vcmVhY3RAMTEvZGlzdC9lbW90aW9uLXJlYWN0LnVtZC5taW4uanMiPjwvc2NyaXB0PgogICAgPHNjcmlwdCBzcmM9Imh0dHBzOi8vdW5wa2cuY29tL0BlbW90aW9uL3N0eWxlZEAxMS9kaXN0L2Vtb3Rpb24tc3R5bGVkLnVtZC5taW4uanMiPjwvc2NyaXB0PgogICAgPHNjcmlwdCBzcmM9Imh0dHBzOi8vdW5wa2cuY29tL0BtdWkvbWF0ZXJpYWxANS4xNS4wL3VtZC9tYXRlcmlhbC11aS5wcm9kdWN0aW9uLm1pbi5qcyI+PC9zY3JpcHQ+CiAgICA8c2NyaXB0IHNyYz0iaHR0cHM6Ly91bnBrZy5jb20vQGJhYmVsL3N0YW5kYWxvbmUvYmFiZWwubWluLmpzIj48L3NjcmlwdD4KCiAgICA8c3R5bGU+CiAgICAgICAgaHRtbCwgYm9keSwgI3Jvb3QgeyAKICAgICAgICAgICAgaGVpZ2h0OiAxMDB2aDsgCiAgICAgICAgICAgIHdpZHRoOiAxMDB2dzsKICAgICAgICAgICAgbWFyZ2luOiAwOyAKICAgICAgICAgICAgcGFkZGluZzogMDsgCiAgICAgICAgICAgIG92ZXJmbG93OiBoaWRkZW47IAogICAgICAgICAgICBiYWNrZ3JvdW5kLWNvbG9yOiAjZjRmN2Y5OwogICAgICAgIH0KICAgICAgICAuYXBwLWNvbnRhaW5lciB7CiAgICAgICAgICAgIGhlaWdodDogMTAwdmg7CiAgICAgICAgICAgIGRpc3BsYXk6IGZsZXg7CiAgICAgICAgICAgIGZsZXgtZGlyZWN0aW9uOiBjb2x1bW47CiAgICAgICAgICAgIHBhZGRpbmc6IDE2cHg7CiAgICAgICAgICAgIGJveC1zaXppbmc6IGJvcmRlci1ib3g7CiAgICAgICAgfQogICAgICAgIC50YWItcGFuZWwgewogICAgICAgICAgICBmbGV4LWdyb3c6IDE7CiAgICAgICAgICAgIG92ZXJmbG93OiBoaWRkZW47CiAgICAgICAgICAgIGRpc3BsYXk6IGZsZXg7CiAgICAgICAgICAgIGZsZXgtZGlyZWN0aW9uOiBjb2x1bW47CiAgICAgICAgICAgIG1hcmdpbi10b3A6IDE2cHg7CiAgICAgICAgfQogICAgICAgIC5qc29uLWRpc3BsYXkgeyAKICAgICAgICAgICAgYmFja2dyb3VuZDogIzFlMWUxZTsgCiAgICAgICAgICAgIGNvbG9yOiAjNzViZWZmOyAKICAgICAgICAgICAgcGFkZGluZzogMTZweDsgCiAgICAgICAgICAgIGJvcmRlci1yYWRpdXM6IDhweDsgCiAgICAgICAgICAgIG92ZXJmbG93OiBhdXRvOyAKICAgICAgICAgICAgZm9udC1mYW1pbHk6ICdDb25zb2xhcycsICdNb25hY28nLCBtb25vc3BhY2U7CiAgICAgICAgICAgIGZvbnQtc2l6ZTogMTJweDsgCiAgICAgICAgICAgIGZsZXgtZ3JvdzogMTsKICAgICAgICAgICAgYm9yZGVyOiAxcHggc29saWQgIzMzMzsKICAgICAgICAgICAgbWFyZ2luOiAwOwogICAgICAgIH0KICAgICAgICAudGFibGUtd3JhcHBlciB7CiAgICAgICAgICAgIGZsZXgtZ3JvdzogMTsKICAgICAgICAgICAgb3ZlcmZsb3c6IGF1dG87CiAgICAgICAgICAgIGJvcmRlci1yYWRpdXM6IDhweDsKICAgICAgICAgICAgYmFja2dyb3VuZDogd2hpdGU7CiAgICAgICAgICAgIGJvcmRlcjogMXB4IHNvbGlkICNkZGQ7CiAgICAgICAgfQogICAgPC9zdHlsZT4KPC9oZWFkPgo8Ym9keT4KICAgIDxkaXYgaWQ9InJvb3QiPjwvZGl2PgogICAgPHNjcmlwdCB0eXBlPSJ0ZXh0L2JhYmVsIj4KICAgICAgICBjb25zdCB7CiAgICAgICAgICAgIENvbnRhaW5lciwgVHlwb2dyYXBoeSwgQm94LCBQYXBlciwgQnV0dG9uLCBUZXh0RmllbGQsIAogICAgICAgICAgICBHcmlkLCBDaXJjdWxhclByb2dyZXNzLCBUYWJzLCBUYWIsCiAgICAgICAgICAgIFRhYmxlLCBUYWJsZUJvZHksIFRhYmxlQ2VsbCwgVGFibGVDb250YWluZXIsIFRhYmxlSGVhZCwgVGFibGVSb3csCiAgICAgICAgICAgIFNlbGVjdCwgTWVudUl0ZW0sIEZvcm1Db250cm9sLCBJbnB1dExhYmVsLCBDaGlwLCBTdGFjawogICAgICAgIH0gPSBNYXRlcmlhbFVJOwoKICAgICAgICBmdW5jdGlvbiBBcHAoKSB7CiAgICAgICAgICAgIGNvbnN0IFthY3RpdmVUYWIsIHNldEFjdGl2ZVRhYl0gPSBSZWFjdC51c2VTdGF0ZSgwKTsKICAgICAgICAgICAgY29uc3QgW2xvYWRpbmcsIHNldExvYWRpbmddID0gUmVhY3QudXNlU3RhdGUoZmFsc2UpOwogICAgICAgICAgICAKICAgICAgICAgICAgLy8gSW5wdXRzCiAgICAgICAgICAgIGNvbnN0IFtiaWxsaW5nRGF0ZSwgc2V0QmlsbGluZ0RhdGVdID0gUmVhY3QudXNlU3RhdGUoIiIpOwogICAgICAgICAgICBjb25zdCBbc3luY01vZGUsIHNldFN5bmNNb2RlXSA9IFJlYWN0LnVzZVN0YXRlKCJub25lIik7CiAgICAgICAgICAgIGNvbnN0IFtzdGF0c0tleSwgc2V0U3RhdHNLZXldID0gUmVhY3QudXNlU3RhdGUoIiIpOwogICAgICAgICAgICAKICAgICAgICAgICAgLy8gRGF0YQogICAgICAgICAgICBjb25zdCBbaW52UmVzdWx0cywgc2V0SW52UmVzdWx0c10gPSBSZWFjdC51c2VTdGF0ZShudWxsKTsKICAgICAgICAgICAgY29uc3QgW3ByaWNpbmdSZXMsIHNldFByaWNpbmdSZXNdID0gUmVhY3QudXNlU3RhdGUobnVsbCk7CiAgICAgICAgICAgIGNvbnN0IFt1c2FnZVJlcywgc2V0VXNhZ2VSZXNdID0gUmVhY3QudXNlU3RhdGUobnVsbCk7CiAgICAgICAgICAgIGNvbnN0IFttb2RlbHNSZXMsIHNldE1vZGVsc1Jlc10gPSBSZWFjdC51c2VTdGF0ZShudWxsKTsKCiAgICAgICAgICAgIGNvbnN0IGFwaUNhbGwgPSBhc3luYyAoZW5kcG9pbnQsIHNldHRlcikgPT4gewogICAgICAgICAgICAgICAgc2V0TG9hZGluZyh0cnVlKTsKICAgICAgICAgICAgICAgIHRyeSB7CiAgICAgICAgICAgICAgICAgICAgY29uc3QgcmVzcG9uc2UgPSBhd2FpdCBmZXRjaChlbmRwb2ludCk7CiAgICAgICAgICAgICAgICAgICAgY29uc3QgZGF0YSA9IGF3YWl0IHJlc3BvbnNlLmpzb24oKTsKICAgICAgICAgICAgICAgICAgICBzZXR0ZXIoZGF0YSk7CiAgICAgICAgICAgICAgICB9IGNhdGNoIChlcnIpIHsKICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmVycm9yKCJBUEkgRXJyb3I6IiwgZXJyKTsKICAgICAgICAgICAgICAgIH0gZmluYWxseSB7CiAgICAgICAgICAgICAgICAgICAgc2V0TG9hZGluZyhmYWxzZSk7CiAgICAgICAgICAgICAgICB9CiAgICAgICAgICAgIH07CgogICAgICAgICAgICAvLyBBdXRvLWZldGNoIGxvZ2ljIHdoZW4gdGFicyBjaGFuZ2UgKEV4Y2x1ZGluZyBVc2FnZSBTdGF0cykKICAgICAgICAgICAgUmVhY3QudXNlRWZmZWN0KCgpID0+IHsKICAgICAgICAgICAgICAgIGlmIChhY3RpdmVUYWIgPT09IDEgJiYgIXByaWNpbmdSZXMpIGFwaUNhbGwoIi9iaWZyb3N0L3ByaWNpbmdTaGVldCIsIHNldFByaWNpbmdSZXMpOwogICAgICAgICAgICAgICAgaWYgKGFjdGl2ZVRhYiA9PT0gMyAmJiAhbW9kZWxzUmVzKSBhcGlDYWxsKCIvb3BlbnJvdXRlci9tb2RlbHMiLCBzZXRNb2RlbHNSZXMpOwogICAgICAgICAgICB9LCBbYWN0aXZlVGFiXSk7CgogICAgICAgICAgICBjb25zdCB0cmlnZ2VySW52b2ljaW5nID0gKCkgPT4gewogICAgICAgICAgICAgICAgbGV0IHBhdGggPSAiL2ludm9pY2luZy9nZW5lcmF0ZT9kcnlfcnVuPSIgKyBzeW5jTW9kZTsKICAgICAgICAgICAgICAgIGlmIChiaWxsaW5nRGF0ZSkgcGF0aCArPSAiJmRhdGU9IiArIGJpbGxpbmdEYXRlOwogICAgICAgICAgICAgICAgYXBpQ2FsbChwYXRoLCBzZXRJbnZSZXN1bHRzKTsKICAgICAgICAgICAgfTsKCiAgICAgICAgICAgIGNvbnN0IGZldGNoVXNhZ2UgPSAoKSA9PiB7CiAgICAgICAgICAgICAgICBpZiAoIXN0YXRzS2V5KSB7CiAgICAgICAgICAgICAgICAgICAgYWxlcnQoIlVzZXIgS2V5IGlzIHJlcXVpcmVkIGZvciBVc2FnZSBTdGF0cyIpOwogICAgICAgICAgICAgICAgICAgIHJldHVybjsKICAgICAgICAgICAgICAgIH0KICAgICAgICAgICAgICAgIGFwaUNhbGwoIi91c2FnZT9rZXk9IiArIHN0YXRzS2V5LCBzZXRVc2FnZVJlcyk7CiAgICAgICAgICAgIH07CgogICAgICAgICAgICByZXR1cm4gKAogICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9ImFwcC1jb250YWluZXIiPgogICAgICAgICAgICAgICAgICAgIDxQYXBlciBlbGV2YXRpb249ezF9IHN4PXt7IGJvcmRlclJhZGl1czogMiB9fT4KICAgICAgICAgICAgICAgICAgICAgICAgPFRhYnMgdmFsdWU9e2FjdGl2ZVRhYn0gb25DaGFuZ2U9eyhlLCB2KSA9PiBzZXRBY3RpdmVUYWIodil9IHZhcmlhbnQ9ImZ1bGxXaWR0aCI+CiAgICAgICAgICAgICAgICAgICAgICAgICAgICA8VGFiIGxhYmVsPSJSdW4gSW52b2ljaW5nIiAvPgogICAgICAgICAgICAgICAgICAgICAgICAgICAgPFRhYiBsYWJlbD0iUHJpY2luZyBTaGVldCIgLz4KICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxUYWIgbGFiZWw9IlVzYWdlIFN0YXRzIiAvPgogICAgICAgICAgICAgICAgICAgICAgICAgICAgPFRhYiBsYWJlbD0iQ2x1c3RlciBNb2RlbHMiIC8+CiAgICAgICAgICAgICAgICAgICAgICAgIDwvVGFicz4KICAgICAgICAgICAgICAgICAgICA8L1BhcGVyPgoKICAgICAgICAgICAgICAgICAgICA8Qm94IGNsYXNzTmFtZT0idGFiLXBhbmVsIj4KICAgICAgICAgICAgICAgICAgICAgICAgey8qIFRBQiAwOiBHRU5FUkFURSAqL30KICAgICAgICAgICAgICAgICAgICAgICAge2FjdGl2ZVRhYiA9PT0gMCAmJiAoCiAgICAgICAgICAgICAgICAgICAgICAgICAgICA8R3JpZCBjb250YWluZXIgc3BhY2luZz17Mn0gc3g9e3sgaGVpZ2h0OiAiMTAwJSIgfX0+CiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPEdyaWQgaXRlbSB4cz17MTJ9IG1kPXszfT4KICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPFN0YWNrIHNwYWNpbmc9ezJ9PgogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPFRleHRGaWVsZCAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBsYWJlbD0iU2ltdWxhdGlvbiBEYXRlIChPcHRpb25hbCkiIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHR5cGU9ImRhdGUiIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhbHVlPXtiaWxsaW5nRGF0ZX0gCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgb25DaGFuZ2U9e2UgPT4gc2V0QmlsbGluZ0RhdGUoZS50YXJnZXQudmFsdWUpfSAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBJbnB1dExhYmVsUHJvcHM9e3sgc2hyaW5rOiB0cnVlIH19IAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGZ1bGxXaWR0aCAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8+CiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8Rm9ybUNvbnRyb2wgZnVsbFdpZHRoPgogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxJbnB1dExhYmVsPlN5bmMgVHlwZTwvSW5wdXRMYWJlbD4KICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8U2VsZWN0IHZhbHVlPXtzeW5jTW9kZX0gbGFiZWw9IlN5bmMgVHlwZSIgb25DaGFuZ2U9e2UgPT4gc2V0U3luY01vZGUoZS50YXJnZXQudmFsdWUpfT4KICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPE1lbnVJdGVtIHZhbHVlPSJub25lIj5MaXZlIChPZG9vIFN5bmMpPC9NZW51SXRlbT4KICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPE1lbnVJdGVtIHZhbHVlPSJ2YWxpZGF0ZSI+VmFsaWRhdGUgT25seTwvTWVudUl0ZW0+CiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxNZW51SXRlbSB2YWx1ZT0iYWxsIj5GdWxsIERyeSBSdW48L01lbnVJdGVtPgogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDwvU2VsZWN0PgogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPC9Gb3JtQ29udHJvbD4KICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxCdXR0b24gCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFyaWFudD0iY29udGFpbmVkIiAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBvbkNsaWNrPXt0cmlnZ2VySW52b2ljaW5nfSAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBkaXNhYmxlZD17bG9hZGluZ30KICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzaXplPSJsYXJnZSIKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBkaXNhYmxlRWxldmF0aW9uCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA+CiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAge2xvYWRpbmcgPyA8Q2lyY3VsYXJQcm9ncmVzcyBzaXplPXsyNH0gY29sb3I9ImluaGVyaXQiIC8+IDogIkdlbmVyYXRlIEludm9pY2VzIn0KICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDwvQnV0dG9uPgogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8L1N0YWNrPgogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDwvR3JpZD4KICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8R3JpZCBpdGVtIHhzPXsxMn0gbWQ9ezl9IHN4PXt7IGhlaWdodDogIjEwMCUiLCBkaXNwbGF5OiAiZmxleCIsIGZsZXhEaXJlY3Rpb246ICJjb2x1bW4iIH19PgogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT0idGFibGUtd3JhcHBlciI+CiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB7aW52UmVzdWx0cyA/ICgKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8VGFibGUgc2l6ZT0ic21hbGwiIHN0aWNreUhlYWRlcj4KICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPFRhYmxlSGVhZD4KICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxUYWJsZVJvdz4KICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8VGFibGVDZWxsPkN1c3RvbWVyPC9UYWJsZUNlbGw+CiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPFRhYmxlQ2VsbD5Db3N0PC9UYWJsZUNlbGw+CiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPFRhYmxlQ2VsbD5TdGF0dXM8L1RhYmxlQ2VsbD4KICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8VGFibGVDZWxsPlJlZmVyZW5jZTwvVGFibGVDZWxsPgogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPC9UYWJsZVJvdz4KICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPC9UYWJsZUhlYWQ+CiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxUYWJsZUJvZHk+CiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB7aW52UmVzdWx0cy5kZXRhaWxzLm1hcCgocm93LCBpKSA9PiAoCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPFRhYmxlUm93IGtleT17aX0gaG92ZXI+CiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxUYWJsZUNlbGwgc3g9e3sgZm9udFdlaWdodDogJ2JvbGQnIH19Pntyb3cuaW52b2ljZS5jdXN0b21lcl9uYW1lfTwvVGFibGVDZWxsPgogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8VGFibGVDZWxsPuKCrHtyb3cuaW52b2ljZS50b3RhbF9jb3N0LnRvRml4ZWQoMil9PC9UYWJsZUNlbGw+CiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxUYWJsZUNlbGw+CiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8Q2hpcCAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBsYWJlbD17cm93LnN5bmNfcmVzdWx0LnN0YXR1c30gCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgc2l6ZT0ic21hbGwiIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbG9yPXtyb3cuc3luY19yZXN1bHQuc3RhdHVzID09PSAic3VjY2VzcyIgPyAic3VjY2VzcyIgOiAiZGVmYXVsdCJ9IAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLz4KICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPC9UYWJsZUNlbGw+CiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxUYWJsZUNlbGwgc3g9e3sgZm9udFNpemU6ICIxMHB4IiwgY29sb3I6ICIjODg4IiB9fT4KICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHtyb3cuc3luY19yZXN1bHQub2Rvb19pZCB8fCByb3cuc3luY19yZXN1bHQuZXJyb3IgfHwgIi0ifQogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8L1RhYmxlQ2VsbD4KICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8L1RhYmxlUm93PgogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgKSl9CiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDwvVGFibGVCb2R5PgogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDwvVGFibGU+CiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICApIDogKAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxCb3ggc3g9e3sgcDogNCwgdGV4dEFsaWduOiAiY2VudGVyIiwgY29sb3I6ICIjYWFhIiB9fT4KICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgQ29uZmlndXJlIHBhcmFtZXRlcnMgYW5kIHJ1biBpbnZvaWNpbmcgdG8gc2VlIHJlc3VsdHMuCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPC9Cb3g+CiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICApfQogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8L2Rpdj4KICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8L0dyaWQ+CiAgICAgICAgICAgICAgICAgICAgICAgICAgICA8L0dyaWQ+CiAgICAgICAgICAgICAgICAgICAgICAgICl9CgogICAgICAgICAgICAgICAgICAgICAgICB7LyogVEFCIDE6IFBSSUNJTkcgKi99CiAgICAgICAgICAgICAgICAgICAgICAgIHthY3RpdmVUYWIgPT09IDEgJiYgKAogICAgICAgICAgICAgICAgICAgICAgICAgICAgPFN0YWNrIHNwYWNpbmc9ezJ9IHN4PXt7IGhlaWdodDogIjEwMCUiIH19PgogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxCb3g+PEJ1dHRvbiBzaXplPSJzbWFsbCIgdmFyaWFudD0ib3V0bGluZWQiIG9uQ2xpY2s9eygpID0+IGFwaUNhbGwoIi9iaWZyb3N0L3ByaWNpbmdTaGVldCIsIHNldFByaWNpbmdSZXMpfT5SZWZyZXNoPC9CdXR0b24+PC9Cb3g+CiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPHByZSBjbGFzc05hbWU9Impzb24tZGlzcGxheSI+e3ByaWNpbmdSZXMgPyBKU09OLnN0cmluZ2lmeShwcmljaW5nUmVzLCBudWxsLCAyKSA6ICIvLyBMb2FkaW5nIHByaWNpbmcgZGF0YS4uLiJ9PC9wcmU+CiAgICAgICAgICAgICAgICAgICAgICAgICAgICA8L1N0YWNrPgogICAgICAgICAgICAgICAgICAgICAgICApfQoKICAgICAgICAgICAgICAgICAgICAgICAgey8qIFRBQiAyOiBVU0FHRSAqL30KICAgICAgICAgICAgICAgICAgICAgICAge2FjdGl2ZVRhYiA9PT0gMiAmJiAoCiAgICAgICAgICAgICAgICAgICAgICAgICAgICA8U3RhY2sgc3BhY2luZz17Mn0gc3g9e3sgaGVpZ2h0OiAiMTAwJSIgfX0+CiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPFN0YWNrIGRpcmVjdGlvbj0icm93IiBzcGFjaW5nPXsyfSBhbGlnbkl0ZW1zPSJjZW50ZXIiPgogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8VGV4dEZpZWxkIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbGFiZWw9IlVzZXIgS2V5IChSZXF1aXJlZCkiIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgc2l6ZT0ic21hbGwiIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFsdWU9e3N0YXRzS2V5fSAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG9uQ2hhbmdlPXtlID0+IHNldFN0YXRzS2V5KGUudGFyZ2V0LnZhbHVlKX0gCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzeD17eyB3aWR0aDogMzUwIH19CiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8+CiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxCdXR0b24gdmFyaWFudD0iY29udGFpbmVkIiBvbkNsaWNrPXtmZXRjaFVzYWdlfSBkaXNhYmxlZD17bG9hZGluZ30gZGlzYWJsZUVsZXZhdGlvbj4KICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHtsb2FkaW5nID8gPENpcmN1bGFyUHJvZ3Jlc3Mgc2l6ZT17MjB9IGNvbG9yPSJpbmhlcml0IiAvPiA6ICJGZXRjaCBVc2FnZSBTdGF0cyJ9CiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDwvQnV0dG9uPgogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDwvU3RhY2s+CiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPHByZSBjbGFzc05hbWU9Impzb24tZGlzcGxheSI+e3VzYWdlUmVzID8gSlNPTi5zdHJpbmdpZnkodXNhZ2VSZXMsIG51bGwsIDIpIDogIi8vIEVudGVyIHVzZXIga2V5IGFuZCBjbGljayBmZXRjaCJ9PC9wcmU+CiAgICAgICAgICAgICAgICAgICAgICAgICAgICA8L1N0YWNrPgogICAgICAgICAgICAgICAgICAgICAgICApfQoKICAgICAgICAgICAgICAgICAgICAgICAgey8qIFRBQiAzOiBNT0RFTFMgKi99CiAgICAgICAgICAgICAgICAgICAgICAgIHthY3RpdmVUYWIgPT09IDMgJiYgKAogICAgICAgICAgICAgICAgICAgICAgICAgICAgPFN0YWNrIHNwYWNpbmc9ezJ9IHN4PXt7IGhlaWdodDogIjEwMCUiIH19PgogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxCb3g+PEJ1dHRvbiBzaXplPSJzbWFsbCIgdmFyaWFudD0ib3V0bGluZWQiIG9uQ2xpY2s9eygpID0+IGFwaUNhbGwoIi9vcGVucm91dGVyL21vZGVscyIsIHNldE1vZGVsc1Jlcyl9PlJlZnJlc2g8L0J1dHRvbj48L0JveD4KICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8cHJlIGNsYXNzTmFtZT0ianNvbi1kaXNwbGF5Ij57bW9kZWxzUmVzID8gSlNPTi5zdHJpbmdpZnkobW9kZWxzUmVzLCBudWxsLCAyKSA6ICIvLyBMb2FkaW5nIG1vZGVsIGRhdGEuLi4ifTwvcHJlPgogICAgICAgICAgICAgICAgICAgICAgICAgICAgPC9TdGFjaz4KICAgICAgICAgICAgICAgICAgICAgICAgKX0KICAgICAgICAgICAgICAgICAgICA8L0JveD4KICAgICAgICAgICAgICAgIDwvZGl2PgogICAgICAgICAgICApOwogICAgICAgIH0KCiAgICAgICAgY29uc3Qgcm9vdCA9IFJlYWN0RE9NLmNyZWF0ZVJvb3QoZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ3Jvb3QnKSk7CiAgICAgICAgcm9vdC5yZW5kZXIoPEFwcCAvPik7CiAgICA8L3NjcmlwdD4KPC9ib2R5Pgo8L2h0bWw+`);

// --- CONFIG ---
const CONFIG = IS_PRODUCTION
  ? {
      bifrostUrl: "http://bifrost.bifrost:8080",
      useInClusterAuth: true,
      tokenPath: "/var/run/secrets/kubernetes.io/serviceaccount/token",
      caPath: "/var/run/secrets/kubernetes.io/serviceaccount/ca.crt",
      k8sHost: process.env.KUBERNETES_SERVICE_HOST,
      k8sPort: process.env.KUBERNETES_SERVICE_PORT,
      odooUrl: process.env.ODOO_URL || "https://inferencebros.odoo.com",
      odooApiKey: process.env.ODOO_API_KEY || "",
      odooDatabase: process.env.ODOO_DATABASE || "inferencebros",
      odooTaxId: parseInt(process.env.ODOO_TAX_ID || "129"),
    }
  : {
      bifrostUrl: "http://localhost:8082",
      useInClusterAuth: false,
      kubeconfig: process.env.KUBECONFIG || `${process.env.HOME}/.kube/config`,
      odooUrl: process.env.ODOO_URL || "https://inferencebros.odoo.com",
      odooApiKey: process.env.ODOO_API_KEY || "",
      odooDatabase: process.env.ODOO_DATABASE || "inferencebros",
      odooTaxId: parseInt(process.env.ODOO_TAX_ID || "129"),
    };

// --- UTILS ---

function logger(level, message, data = "") {
  const timestamp = new Date().toISOString();
  const cleanData = typeof data === "object" ? JSON.stringify(data) : data;
  console.log(`[${timestamp}] [${level}] ${message} ${cleanData}`);
}

function request(url, options = {}) {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith("https") ? https : http;
    const timeout = options.timeout || 30000;

    let requestBody = options.body;
    const headers = { ...options.headers };

    if (requestBody && typeof requestBody === 'object') {
      requestBody = JSON.stringify(requestBody);
      headers['Content-Type'] = 'application/json';
      headers['Content-Length'] = Buffer.byteLength(requestBody);
    }

    const requestOptions = { ...options, headers };

    const req = protocol.request(url, requestOptions, (res) => {
      let body = "";
      res.on("data", (chunk) => (body += chunk));
      res.on("end", () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          try {
            resolve(JSON.parse(body));
          } catch (e) {
            resolve(body);
          }
        } else {
          reject(new Error(`API Error (${res.statusCode}): ${body}`));
        }
      });
    });

    req.setTimeout(timeout, () => {
      req.destroy();
      reject(new Error(`Request timeout after ${timeout}ms`));
    });

    req.on("error", reject);

    if (requestBody) {
      req.write(requestBody);
    }
    req.end();
  });
}

// --- VALIDATION ---

async function validateApiKey(apiKey) {
  try {
    const url = `${CONFIG.bifrostUrl}/api/governance/virtual-keys`;
    const response = await request(url);

    const allKeys = response.virtual_keys || [];
    const matchingKey = allKeys.find((vk) => vk.value === apiKey);

    if (!matchingKey) {
      return { valid: false, reason: "Key not found" };
    }

    if (!matchingKey.is_active) {
      return { valid: false, reason: "Key inactive" };
    }

    return {
      valid: true,
      keyId: matchingKey.id,
      keyName: matchingKey.name,
    };
  } catch (err) {
    logger("WARN", `API key validation failed`, err.message);
    return { valid: false, reason: "Service error" };
  }
}

function getBillingRange(referenceDate = null) {
  const now = referenceDate ? new Date(referenceDate) : new Date();

  const start = new Date(
    Date.UTC(
      now.getUTCFullYear(),
      now.getUTCMonth() - 1,
      1,
      0,
      0,
      0,
      0,
    ),
  );

  const end = new Date(
    Date.UTC(
      now.getUTCFullYear(),
      now.getUTCMonth(),
      1,
      0,
      0,
      0,
      0,
    ),
  );

  return {
    start_date: start.toISOString(),
    end_date: end.toISOString(),
    month_label: `${start.getUTCFullYear()}-${String(start.getUTCMonth() + 1).padStart(2, "0")}`,
  };
}

// --- CORE PRICING & USAGE LOGIC ---

async function getK8sModelNames() {
  let kubeData;
  try {
    if (!CONFIG.useInClusterAuth) {
      const kubeconfigArg = CONFIG.kubeconfig
        ? `--kubeconfig=${CONFIG.kubeconfig}`
        : "";
      const { stdout } = await execAsync(
        `kubectl ${kubeconfigArg} get models.kubeai.org -n kubeai -o json`,
      );
      kubeData = JSON.parse(stdout);
    } else {
      const token = fs.readFileSync(CONFIG.tokenPath, "utf8");
      const ca = fs.readFileSync(CONFIG.caPath);
      kubeData = await request(
        `https://${CONFIG.k8sHost}:${CONFIG.k8sPort}/apis/kubeai.org/v1/models`,
        {
          ca,
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
          },
        },
      );
    }
  } catch (err) {
    logger("ERROR", "Failed to fetch Kubernetes Model Names", err.message);
    return {};
  }

  const nameMap = {};
  kubeData.items?.forEach((item) => {
    const raw = item.metadata.annotations?.["openrouter.ai/json"];
    if (!raw) return;
    try {
      const m = JSON.parse(raw);
      nameMap[m.id] = m.name;
    } catch (e) {}
  });
  return nameMap;
}

// Fetch historical list of models from Bifrost logs to prevent data loss on deleted models
async function getBifrostModelIds() {
  try {
    const url = `${CONFIG.bifrostUrl}/api/logs/filterdata`;
    const response = await request(url);
    return response.models || []; 
  } catch (err) {
    logger("ERROR", "Failed to fetch historical models from Bifrost", err.message);
    return [];
  }
}

async function getUsageStats(vkId, startDate, endDate, model = null) {
  const startEnc = encodeURIComponent(startDate);
  const endEnc = encodeURIComponent(endDate);

  let url = `${CONFIG.bifrostUrl}/api/logs/stats?virtual_key_ids=${vkId}&start_time=${startEnc}&end_time=${endEnc}`;
  if (model) {
    url += `&models=${encodeURIComponent(model)}`;
  }

  try {
    const response = await request(url);
    return {
      total_requests: response.total_requests || 0,
      total_tokens: response.total_tokens || 0,
      total_cost: response.total_cost || 0,
    };
  } catch (err) {
    logger("ERROR", `Stats aggregation failed for VK ${vkId}`, err.message);
    return {
      total_requests: 0,
      total_tokens: 0,
      total_cost: 0,
    };
  }
}

async function aggregateUsageFromStats(vkId, startDate, endDate, modelIds) {
  const usagePromises = modelIds.map(async (modelId) => {
    const stats = await getUsageStats(vkId, startDate, endDate, modelId);
    return { modelId, stats };
  });

  const results = await Promise.all(usagePromises);
  const modelUsage = {};

  for (const { modelId, stats } of results) {
    if (stats.total_requests > 0 || stats.total_cost > 0) {
      modelUsage[modelId] = {
        total_tokens: stats.total_tokens,
        total_requests: stats.total_requests,
        total_cost: stats.total_cost,
      };
    }
  }

  return modelUsage;
}

async function generateInvoices(nowString, referenceDate = null) {
  const billingInfo = getBillingRange(referenceDate);
  const { start_date, end_date, month_label } = billingInfo;

  logger(
    "INFO",
    `Analyzing usage period: ${start_date} to ${end_date}${month_label ? ` (${month_label})` : ""}`,
  );

  // We rely on Bifrost to give us all models that had activity in this period
  const [bifrostModelIds, vkResponse] = await Promise.all([
    getBifrostModelIds(),
    request(`${CONFIG.bifrostUrl}/api/governance/virtual-keys`),
  ]);

  const allKeys = vkResponse.virtual_keys || [];
  const keysByCustomer = allKeys.reduce((acc, vk) => {
    const cid = vk.customer_id;
    if (!cid) return acc;
    if (!acc[cid])
      acc[cid] = {
        id: cid,
        name: vk.customer?.name || `Customer ${cid}`,
        keys: [],
      };
    acc[cid].keys.push(vk);
    return acc;
  }, {});

  const invoicePromises = Object.values(keysByCustomer).map(async (group) => {
    const usageResults = await Promise.all(
      group.keys.map((vk) =>
        aggregateUsageFromStats(vk.id, start_date, end_date, bifrostModelIds),
      ),
    );
    const combinedUsage = {};
    usageResults.forEach((res) => {
      for (const [mid, stats] of Object.entries(res)) {
        if (!combinedUsage[mid])
          combinedUsage[mid] = { total_tokens: 0, total_requests: 0, total_cost: 0 };
        combinedUsage[mid].total_tokens += stats.total_tokens;
        combinedUsage[mid].total_requests += stats.total_requests;
        combinedUsage[mid].total_cost += stats.total_cost;
      }
    });
    return buildInvoice(
      group,
      combinedUsage,
      start_date,
      end_date,
      month_label,
      nowString,
    );
  });

  const invoices = await Promise.all(invoicePromises);
  return invoices.filter((inv) => inv.total_tokens > 0);
}

function buildInvoice(
  customer,
  combinedUsage,
  start,
  end,
  monthLabel,
  nowString,
) {
  const location = process.env.LOCATION || "local";
  const cleanName = customer.name.replace(/\s+/g, "_");

  const periodId = monthLabel || `${start}_${end}`;
  const invoice_id = `${cleanName}_${periodId}_${location}`.replace(/:/g, "-");

  const inv = {
    invoice_id,
    customer_id: customer.id,
    customer_name: customer.name,
    currency: "EUR",
    issued_at: nowString,
    location,
    period: { start, end },
    total_cost: 0,
    total_tokens: 0,
    models: {},
  };

  for (const [mid, usage] of Object.entries(combinedUsage)) {
    // Usage of modelId directly as requested
    inv.models[mid] = {
      model_name: mid,
      total_tokens: usage.total_tokens,
      total_requests: usage.total_requests,
      cost: Number(usage.total_cost.toFixed(6)),
    };

    inv.total_tokens += usage.total_tokens;
    inv.total_cost += usage.total_cost;
  }

  inv.total_cost = Number(inv.total_cost.toFixed(6));
  return inv;
}

// --- USAGE QUERY ---

async function calculateUsage(apiKey, startDate, endDate) {
  logger("INFO", `Calculating usage for key ${apiKey} from ${startDate} to ${endDate}`);

  // Decoupled from K8s to avoid data loss on replaced models
  const bifrostModelIds = await getBifrostModelIds();
  const usageData = await aggregateUsageFromStats(apiKey, startDate, endDate, bifrostModelIds);

  const models = [];
  let totalTokens = 0;
  let totalRequests = 0;
  let totalCost = 0;

  for (const [modelId, usage] of Object.entries(usageData)) {
    models.push({
      model_id: modelId,
      model_name: modelId,
      total_tokens: usage.total_tokens,
      total_requests: usage.total_requests,
      total_cost: Number(usage.total_cost.toFixed(6)),
    });

    totalTokens += usage.total_tokens;
    totalRequests += usage.total_requests;
    totalCost += usage.total_cost;
  }

  models.sort((a, b) => b.total_cost - a.total_cost);

  return {
    period: {
      start: startDate,
      end: endDate,
    },
    summary: {
      total_tokens: totalTokens,
      total_requests: totalRequests,
      total_cost: Number(totalCost.toFixed(6)),
      currency: "EUR",
    },
    models,
  };
}

// --- ODOO INTEGRATION ---

async function odooCall(model, method, body = {}, retries = 3) {
  const url = `${CONFIG.odooUrl}/json/2/${model}/${method}`;
  const payload = {
    context: { lang: "en_US" },
    ...body,
  };

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      return await request(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `bearer ${CONFIG.odooApiKey}`,
          "X-Odoo-Database": CONFIG.odooDatabase,
        },
        body: JSON.stringify(payload),
      });
    } catch (err) {
      if (attempt === retries) throw err;
      const delay = attempt * 1000;
      logger(
        "WARN",
        `Odoo call failed (attempt ${attempt}/${retries}), retrying in ${delay}ms...`,
        err.message,
      );
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }
}

async function findOdooPartner(customerName) {
  try {
    const response = await odooCall("res.partner", "search", {
      domain: [["name", "=", customerName]],
      limit: 1,
    });
    return Array.isArray(response) && response.length > 0 ? response[0] : null;
  } catch (e) {
    logger(
      "ERROR",
      `Odoo Partner Search failed for "${customerName}"`,
      e.message,
    );
    return null;
  }
}

async function checkInvoiceExists(invoiceRef) {
  try {
    const response = await odooCall("account.move", "search", {
      domain: [["ref", "=", invoiceRef]],
      limit: 1,
    });
    return Array.isArray(response) && response.length > 0 ? response[0] : null;
  } catch (e) {
    logger(
      "ERROR",
      `Invoice existence check failed for ref "${invoiceRef}"`,
      e.message,
    );
    return null;
  }
}

async function pushToOdoo(invoice, dryRun = "none") {
  logger(
    "INFO",
    `Syncing Customer: ${invoice.customer_name} [Dry Run: ${dryRun}]`,
  );

  if (dryRun === "all") {
    logger(
      "INFO",
      `DRY_RUN (ALL): Skipping Odoo interaction for ${invoice.invoice_id}`,
    );
    return { status: "dry_run_skipped" };
  }

  const existingInvoice = await checkInvoiceExists(invoice.invoice_id);
  if (existingInvoice) {
    logger("INFO", `DUPLICATE: Invoice ${invoice.invoice_id} already exists.`);
    return { status: "duplicate", odoo_id: existingInvoice };
  }

  if (dryRun === "validate") {
    logger(
      "INFO",
      `DRY_RUN (VALIDATE): Invoice ${invoice.invoice_id} not found in Odoo. Skipping creation.`,
    );
    return { status: "dry_run_validated_missing" };
  }

  const partnerId = await findOdooPartner(invoice.customer_name);
  if (!partnerId) {
    logger("WARN", `MATCH-FAIL: "${invoice.customer_name}" not in Odoo.`);
    return { status: "skipped" };
  }

  const validModels = Object.values(invoice.models).filter((m) => m.cost > 0);
  if (validModels.length === 0)
    return { status: "skipped", reason: "zero_cost" };

  const issueDate = new Date(invoice.issued_at);
  const dueDate = new Date(issueDate);
  dueDate.setUTCDate(issueDate.getUTCDate() + 15);

  const invoiceLines = validModels.map((m) => [
    0,
    0,
    {
      name: `AI Usage: ${m.model_name} (${m.total_tokens.toLocaleString()} tokens, ${m.total_requests.toLocaleString()} requests)`,
      quantity: 1,
      price_unit: m.cost,
      tax_ids: [[6, 0, [CONFIG.odooTaxId]]],
    },
  ]);

  try {
    const result = await odooCall("account.move", "create", {
      vals_list: [
        {
          partner_id: partnerId,
          move_type: "out_invoice",
          ref: String(invoice.invoice_id),
          invoice_date: issueDate.toISOString().split("T")[0],
          invoice_date_due: dueDate.toISOString().split("T")[0],
          invoice_line_ids: invoiceLines,
        },
      ],
    });

    const odooId = Array.isArray(result) ? result[0] : result;

    await odooCall("account.move", "action_post", {
      ids: [odooId],
    });

    const wizardIds = await odooCall("account.move.send.wizard", "create", {
      vals_list: [
        {
          move_id: odooId,
          mail_partner_ids: [partnerId],
        },
      ],
      context: {
        active_model: "account.move",
        active_ids: [odooId],
      },
    });

    const wizardId = Array.isArray(wizardIds) ? wizardIds[0] : wizardIds;

    await odooCall("account.move.send.wizard", "action_send_and_print", {
      ids: [wizardId],
      context: {
        active_model: "account.move",
        active_ids: [odooId],
      },
    });

    logger(
      "SUCCESS",
      `Odoo Invoice Created, Posted & Sent`,
      {
        odoo_id: odooId,
        customer: invoice.customer_name,
      },
    );

    return { status: "success", odoo_id: odooId, emailed: true };
  } catch (err) {
    logger(
      "ERROR",
      `Odoo Process Error for ${invoice.customer_name}`,
      err.message,
    );
    return { status: "error", error: err.message };
  }
}

// --- EXECUTION LOGIC ---

async function executeBillingRun(
  triggerType,
  simulatedDate = null,
  dryRun = "none",
) {
  const now = simulatedDate ? new Date(simulatedDate) : new Date();
  const nowString = now.toISOString();
  console.log("\n" + "=".repeat(60));
  logger(
    "RUN-START",
    `Trigger: ${triggerType}${simulatedDate ? " (SIMULATED)" : ""} | Dry Run: ${dryRun} | Period ending: ${now.toISOString()}`,
  );
  console.log("=".repeat(60));

  try {
    const invoices = await generateInvoices(nowString, simulatedDate);
    const results = [];

    if (invoices.length === 0) {
      logger("INFO", "No billing data found for this period.");
    } else {
      for (const inv of invoices) {
        try {
          const odooRes = await pushToOdoo(inv, dryRun);
          results.push({
            invoice: inv,
            sync_result: odooRes,
          });
        } catch (err) {
          logger("ERROR", `Invoice processing failed, continuing with next`, {
            invoice_id: inv.invoice_id,
            customer: inv.customer_name,
            error: err.message,
          });

          results.push({
            invoice: inv,
            sync_result: {
              status: "fatal_error",
              error: err.message,
            },
          });
        }
      }

      console.log("-".repeat(60));
      logger("RUN-COMPLETE", "Final Report:", {
        total_detected: invoices.length,
        pushed_to_odoo: results.filter(r => r.sync_result.status === "success").length,
        errors: results.filter(r => r.sync_result.status.includes("error")).length,
      });
    }

    console.log("=".repeat(60) + "\n");
    return {
      timestamp: now.toISOString(),
      trigger: triggerType,
      summary: { total_detected: invoices.length },
      details: results,
    };
  } catch (err) {
    logger("FATAL", "Critical Billing Run Failure", err.stack);
    throw err;
  }
}

// --- TRIGGER MECHANISMS ---

let lastRunMonth = -1;

function initCron() {
  logger(
    "INFO",
    "Scheduler active: Monitoring for 2nd of every month at 00:00:00 UTC",
  );
  setInterval(async () => {
    const now = new Date();
    const currentDay = now.getUTCDate();
    const currentHour = now.getUTCHours();
    const currentMinute = now.getUTCMinutes();
    const currentSecond = now.getUTCSeconds();
    const currentMonth = now.getUTCMonth();

    if (
      currentDay === 2 &&
      currentHour === 0 &&
      currentMinute === 0 &&
      currentSecond === 0 &&
      lastRunMonth !== currentMonth
    ) {
      lastRunMonth = currentMonth;
      await executeBillingRun("CRON_JOB");
    }
  }, 1000);
}

const server = http.createServer(async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Authorization, Content-Type");

  if (req.method === "OPTIONS") {
    res.writeHead(200);
    res.end();
    return;
  }

  if (req.url === "/" && req.method === "GET") {
    res.writeHead(200, { "Content-Type": "text/html" });
    res.end(ADMIN_GUI_HTML);
    return;
  }

  if (req.url === "/health" && req.method === "GET") {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ status: "healthy", service: "invoicing" }));
    return;
  }

  if (req.url.startsWith("/invoicing/generate") && req.method === "GET") {
    try {
      const url = new URL(req.url, `http://${req.headers.host}`);
      const simulatedDate = url.searchParams.get("date");
      const dryRunParam = url.searchParams.get("dry_run");
      const dryRun = ["all", "validate"].includes(dryRunParam) ? dryRunParam : "none";

      const report = await executeBillingRun("HTTP_TRIGGER", simulatedDate, dryRun);
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify(report));
    } catch (e) {
      res.writeHead(500, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: e.message }));
    }
    return;
  }

  if (req.url.startsWith("/usage") && req.method === "GET") {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        res.writeHead(401, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "Unauthorized" }));
        return;
      }

      const apiKey = authHeader.substring(7);
      const url = new URL(req.url, `http://${req.headers.host}`);
      const startDate = url.searchParams.get("start_date");
      const endDate = url.searchParams.get("end_date");

      if (!startDate || !endDate) {
        res.writeHead(400, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "Missing dates" }));
        return;
      }

      const validation = await validateApiKey(apiKey);
      if (!validation.valid) {
        res.writeHead(401, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "Invalid key" }));
        return;
      }

      const usage = await calculateUsage(validation.keyId, startDate, endDate);
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify(usage, null, 2));
    } catch (err) {
      res.writeHead(500, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: err.message }));
    }
    return;
  }

  // OpenRouter models endpoint (NEW)
  if (req.url === "/openrouter/models" && req.method === "GET") {
    try {
      if (!CONFIG.useInClusterAuth) {
        // Development mode: use kubectl
        const kubeconfigArg = CONFIG.kubeconfig
          ? `--kubeconfig=${CONFIG.kubeconfig}`
          : "";
        const { stdout } = await execAsync(
          `kubectl ${kubeconfigArg} get models.kubeai.org -n kubeai -o json`,
        );
        const kubeData = JSON.parse(stdout);

        const openRouterModels = kubeData.items
          .filter(
            (item) =>
              item.metadata.annotations &&
              item.metadata.annotations["openrouter.ai/json"],
          )
          .map((item) => {
            try {
              return JSON.parse(
                item.metadata.annotations["openrouter.ai/json"],
              );
            } catch (e) {
              logger("ERROR", `Failed to parse annotation for ${item.metadata.name}`);
              return null;
            }
          })
          .filter((model) => model !== null);

        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ data: openRouterModels }));
      } else {
        // Production mode: use in-cluster auth
        const token = fs.readFileSync(CONFIG.tokenPath, "utf8");
        const ca = fs.readFileSync(CONFIG.caPath);

        const options = {
          hostname: CONFIG.k8sHost,
          port: CONFIG.k8sPort,
          path: "/apis/kubeai.org/v1/models",
          method: "GET",
          ca: ca,
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
          },
        };

        const k8sReq = https.request(options, (k8sRes) => {
          let body = "";
          k8sRes.on("data", (chunk) => (body += chunk));
          k8sRes.on("end", () => {
            if (k8sRes.statusCode === 200) {
              const kubeData = JSON.parse(body);

              const openRouterModels = kubeData.items
                .filter(
                  (item) =>
                    item.metadata.annotations &&
                    item.metadata.annotations["openrouter.ai/json"],
                )
                .map((item) => {
                  try {
                    return JSON.parse(
                      item.metadata.annotations["openrouter.ai/json"],
                    );
                  } catch (e) {
                    logger("ERROR", `Failed to parse annotation for ${item.metadata.name}`);
                    return null;
                  }
                })
                .filter((model) => model !== null);

              res.writeHead(200, { "Content-Type": "application/json" });
              res.end(JSON.stringify({ data: openRouterModels }));
            } else {
              res.writeHead(k8sRes.statusCode, { "Content-Type": "application/json" });
              res.end(JSON.stringify({ error: "K8s API Error", details: body }));
            }
          });
        });

        k8sReq.on("error", (err) => {
          logger("ERROR", "K8s request failed", err.message);
          res.writeHead(500, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ error: "Request Failed", msg: err.message }));
        });
        k8sReq.end();
      }
    } catch (err) {
      logger("ERROR", "OpenRouter models endpoint failed", err.message);
      res.writeHead(500, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "Internal Error", msg: err.message }));
    }
    return;
  }

  if (req.url === "/bifrost/pricingSheet" && req.method === "GET") {
    try {
      let kubeData;
      if (!CONFIG.useInClusterAuth) {
        const kubeconfigArg = CONFIG.kubeconfig ? `--kubeconfig=${CONFIG.kubeconfig}` : "";
        const { stdout } = await execAsync(`kubectl ${kubeconfigArg} get models.kubeai.org -n kubeai -o json`);
        kubeData = JSON.parse(stdout);
      } else {
        const token = fs.readFileSync(CONFIG.tokenPath, "utf8");
        const ca = fs.readFileSync(CONFIG.caPath);
        kubeData = await request(`https://${CONFIG.k8sHost}:${CONFIG.k8sPort}/apis/kubeai.org/v1/models`, {
          ca,
          headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
        });
      }

      const pricingSheet = {};
      kubeData.items?.forEach((item) => {
        const modelName = item.metadata.name;
        const annotationRaw = item.metadata.annotations?.["openrouter.ai/json"];
        if (!annotationRaw) return;
        try {
          const annotation = JSON.parse(annotationRaw);
          const pricing = annotation.pricing || {};
          pricingSheet[`kubeai/${modelName}`] = {
            input_cost_per_token: parseFloat(pricing.prompt || 0),
            output_cost_per_token: parseFloat(pricing.completion || 0),
            input_cost_per_request: parseFloat(pricing.request || 0),
            mode: 'chat',
            provider: 'kubeai'
          };
        } catch (e) {}
      });

      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify(pricingSheet, null, 2));
    } catch (err) {
      res.writeHead(500, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: err.message }));
    }
    return;
  }

  res.writeHead(404);
  res.end();
});

async function runBifrostReconfig() {
  const i = setInterval(() => {
    (async () => {
      try {
        let config = await request(`${CONFIG.bifrostUrl}/api/config?from_db=true`);
        // Cleanup some fields that might cause issues
        delete config.client_config.mcp_agent_depth;
        delete config.client_config.mcp_tool_execution_timeout;
        delete config.client_config.mcp_code_mode_binding_level;
        
        if (config.framework_config.pricing_url !== 'http://control.control/bifrost/pricingSheet') {
          logger("INFO", `Old config: ` + JSON.stringify(config));
          config.framework_config.pricing_url = 'http://control.control/bifrost/pricingSheet';
          config.framework_config.pricing_sync_interval = 3600;
          logger("INFO", `New config: ` + JSON.stringify(config));
          
          await request(`${CONFIG.bifrostUrl}/api/config`, {
            method: 'PUT',
            body: config
          });
          logger("INFO", `Bifrost config updated!`);
          
          await request(`${CONFIG.bifrostUrl}/api/pricing/force-sync`, {
            method: 'POST'
          });
          logger("INFO", `Bifrost pricing synced!`);
        }
        
        logger("INFO", `Bifrost reconfiguration finished successfully!`);
        clearInterval(i);
      } catch (err) {
        logger("ERROR", `Bifrost reconfig failed`, err.message);
      }
    })();
  }, 10000);
}

server.listen(PORT, () => {
  logger("INFO", `Invoicing Service online on port ${PORT}`);
  logger("INFO", `Endpoints:`);
  logger("INFO", `  - GET / (Admin GUI)`);
  logger("INFO", `  - GET /invoicing/generate?date=<ISO>&dry_run=<all|validate|none>`);
  logger("INFO", `  - GET /usage?start_date=<ISO>&end_date=<ISO>`);
  logger("INFO", `  - GET /openrouter/models`);
  logger("INFO", `  - GET /bifrost/pricingSheet`);
  
  runBifrostReconfig();
  initCron();
});