import { contextBridge, ipcRenderer } from "electron";
contextBridge.exposeInMainWorld("electronAPI", {
  onUpdateCounter: (callback) => ipcRenderer.on("update-counter", (_event, value) => callback(value)),
  counterValue: (value) => ipcRenderer.invoke("counter-value", value),
  saveFile: (data) => ipcRenderer.invoke("save-file", data)
});
contextBridge.exposeInMainWorld("ipcRenderer", {
  on(...args) {
    const [channel, listener] = args;
    return ipcRenderer.on(channel, (event, ...args2) => listener(event, ...args2));
  },
  off(...args) {
    const [channel, ...omit] = args;
    return ipcRenderer.off(channel, ...omit);
  },
  send(...args) {
    const [channel, ...omit] = args;
    return ipcRenderer.send(channel, ...omit);
  },
  invoke(...args) {
    const [channel, ...omit] = args;
    return ipcRenderer.invoke(channel, ...omit);
  }
});
function domReady(condition = ["complete", "interactive"]) {
  return new Promise((resolve) => {
    if (condition.includes(document.readyState)) {
      resolve(true);
    } else {
      document.addEventListener("readystatechange", () => {
        if (condition.includes(document.readyState)) {
          resolve(true);
        }
      });
    }
  });
}
const safeDOM = {
  append(parent, child) {
    if (!Array.from(parent.children).find((c) => c === child)) {
      return parent.appendChild(child);
    }
  },
  remove(parent, child) {
    if (Array.from(parent.children).find((c) => c === child)) {
      return parent.removeChild(child);
    }
  }
};
function useLoading() {
  const className = `loaders-css__square-spin`;
  const styleContent = `
@keyframes square-spin {
  25% { 
    transform: perspective(100px) rotateX(180deg) rotateY(0); 
  }
  50% { 
    transform: perspective(100px) rotateX(180deg) rotateY(180deg); 
  }
  75% { 
    transform: perspective(100px) rotateX(0) rotateY(180deg); 
  }
  100% { 
    transform: perspective(100px) rotateX(0) rotateY(0); 
  }
}
.${className} > div {
  animation-fill-mode: both;
  width: 50px;
  height: 50px;
  background: #fff;
  animation: square-spin 3s 0s cubic-bezier(0.09, 0.57, 0.49, 0.9) infinite;
}
.app-loading-wrap {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #282c34;
  z-index: 9;
}
    `;
  const oStyle = document.createElement("style");
  const oDiv = document.createElement("div");
  oStyle.id = "app-loading-style";
  oStyle.innerHTML = styleContent;
  oDiv.className = "app-loading-wrap";
  oDiv.innerHTML = `<div class="${className}"><div></div></div>`;
  return {
    appendLoading() {
      safeDOM.append(document.head, oStyle);
      safeDOM.append(document.body, oDiv);
    },
    removeLoading() {
      safeDOM.remove(document.head, oStyle);
      safeDOM.remove(document.body, oDiv);
    }
  };
}
const { appendLoading, removeLoading } = useLoading();
domReady().then(appendLoading);
window.onmessage = (ev) => {
  ev.data.payload === "removeLoading" && removeLoading();
};
setTimeout(removeLoading, 4999);
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicHJlbG9hZC5qcyIsInNvdXJjZXMiOlsiLi4vZWxlY3Ryb24vcHJlbG9hZC50cyJdLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBjb250ZXh0QnJpZGdlLCBpcGNSZW5kZXJlciB9IGZyb20gJ2VsZWN0cm9uJztcblxuLy8gLS0tLS0tLS0tIEV4cG9zZSBzb21lIEFQSSB0byB0aGUgUmVuZGVyZXIgcHJvY2VzcyAtLS0tLS0tLS1cbmNvbnRleHRCcmlkZ2UuZXhwb3NlSW5NYWluV29ybGQoJ2VsZWN0cm9uQVBJJywge1xuICBvblVwZGF0ZUNvdW50ZXI6IChjYWxsYmFjazogKHZhbHVlOiBudW1iZXIpID0+IHZvaWQpID0+IGlwY1JlbmRlcmVyLm9uKCd1cGRhdGUtY291bnRlcicsIChfZXZlbnQsIHZhbHVlKSA9PiBjYWxsYmFjayh2YWx1ZSkpLFxuICBjb3VudGVyVmFsdWU6ICh2YWx1ZTogbnVtYmVyKSA9PiBpcGNSZW5kZXJlci5pbnZva2UoJ2NvdW50ZXItdmFsdWUnLCB2YWx1ZSksXG4gIHNhdmVGaWxlOiAoZGF0YTogeyBjb250ZW50OiBzdHJpbmc7IGZpbGVuYW1lOiBzdHJpbmcgfSkgPT4gaXBjUmVuZGVyZXIuaW52b2tlKCdzYXZlLWZpbGUnLCBkYXRhKSxcbn0pO1xuXG5jb250ZXh0QnJpZGdlLmV4cG9zZUluTWFpbldvcmxkKCdpcGNSZW5kZXJlcicsIHtcbiAgb24oLi4uYXJnczogUGFyYW1ldGVyczx0eXBlb2YgaXBjUmVuZGVyZXIub24+KSB7XG4gICAgY29uc3QgW2NoYW5uZWwsIGxpc3RlbmVyXSA9IGFyZ3M7XG4gICAgcmV0dXJuIGlwY1JlbmRlcmVyLm9uKGNoYW5uZWwsIChldmVudCwgLi4uYXJncykgPT4gbGlzdGVuZXIoZXZlbnQsIC4uLmFyZ3MpKTtcbiAgfSxcbiAgb2ZmKC4uLmFyZ3M6IFBhcmFtZXRlcnM8dHlwZW9mIGlwY1JlbmRlcmVyLm9mZj4pIHtcbiAgICBjb25zdCBbY2hhbm5lbCwgLi4ub21pdF0gPSBhcmdzO1xuICAgIHJldHVybiBpcGNSZW5kZXJlci5vZmYoY2hhbm5lbCwgLi4ub21pdCk7XG4gIH0sXG4gIHNlbmQoLi4uYXJnczogUGFyYW1ldGVyczx0eXBlb2YgaXBjUmVuZGVyZXIuc2VuZD4pIHtcbiAgICBjb25zdCBbY2hhbm5lbCwgLi4ub21pdF0gPSBhcmdzO1xuICAgIHJldHVybiBpcGNSZW5kZXJlci5zZW5kKGNoYW5uZWwsIC4uLm9taXQpO1xuICB9LFxuICBpbnZva2UoLi4uYXJnczogUGFyYW1ldGVyczx0eXBlb2YgaXBjUmVuZGVyZXIuaW52b2tlPikge1xuICAgIGNvbnN0IFtjaGFubmVsLCAuLi5vbWl0XSA9IGFyZ3M7XG4gICAgcmV0dXJuIGlwY1JlbmRlcmVyLmludm9rZShjaGFubmVsLCAuLi5vbWl0KTtcbiAgfSxcbn0pO1xuXG4vLyAtLS0tLS0tLS0gUHJlbG9hZCBzY3JpcHRzIGxvYWRpbmcgLS0tLS0tLS0tXG5mdW5jdGlvbiBkb21SZWFkeShjb25kaXRpb246IERvY3VtZW50UmVhZHlTdGF0ZVtdID0gWydjb21wbGV0ZScsICdpbnRlcmFjdGl2ZSddKSB7XG4gIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSkgPT4ge1xuICAgIGlmIChjb25kaXRpb24uaW5jbHVkZXMoZG9jdW1lbnQucmVhZHlTdGF0ZSkpIHtcbiAgICAgIHJlc29sdmUodHJ1ZSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIGRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIoJ3JlYWR5c3RhdGVjaGFuZ2UnLCAoKSA9PiB7XG4gICAgICAgIGlmIChjb25kaXRpb24uaW5jbHVkZXMoZG9jdW1lbnQucmVhZHlTdGF0ZSkpIHtcbiAgICAgICAgICByZXNvbHZlKHRydWUpO1xuICAgICAgICB9XG4gICAgICB9KTtcbiAgICB9XG4gIH0pO1xufVxuXG5jb25zdCBzYWZlRE9NID0ge1xuICBhcHBlbmQocGFyZW50OiBIVE1MRWxlbWVudCwgY2hpbGQ6IEhUTUxFbGVtZW50KSB7XG4gICAgaWYgKCFBcnJheS5mcm9tKHBhcmVudC5jaGlsZHJlbikuZmluZChjID0+IGMgPT09IGNoaWxkKSkge1xuICAgICAgcmV0dXJuIHBhcmVudC5hcHBlbmRDaGlsZChjaGlsZCk7XG4gICAgfVxuICB9LFxuICByZW1vdmUocGFyZW50OiBIVE1MRWxlbWVudCwgY2hpbGQ6IEhUTUxFbGVtZW50KSB7XG4gICAgaWYgKEFycmF5LmZyb20ocGFyZW50LmNoaWxkcmVuKS5maW5kKGMgPT4gYyA9PT0gY2hpbGQpKSB7XG4gICAgICByZXR1cm4gcGFyZW50LnJlbW92ZUNoaWxkKGNoaWxkKTtcbiAgICB9XG4gIH0sXG59O1xuXG4vKipcbiAqIGh0dHBzOi8vdG9iaWFzYWhsaW4uY29tL3NwaW5raXRcbiAqIGh0dHBzOi8vY29ubm9yYXRoZXJ0b24uY29tL2xvYWRlcnNcbiAqIGh0dHBzOi8vcHJvamVjdHMubHVrZWhhYXMubWUvY3NzLWxvYWRlcnNcbiAqIGh0dHBzOi8vbWF0ZWprdXN0ZWMuZ2l0aHViLmlvL1NwaW5UaGF0U2hpdFxuICovXG5mdW5jdGlvbiB1c2VMb2FkaW5nKCkge1xuICBjb25zdCBjbGFzc05hbWUgPSBgbG9hZGVycy1jc3NfX3NxdWFyZS1zcGluYDtcbiAgY29uc3Qgc3R5bGVDb250ZW50ID0gYFxuQGtleWZyYW1lcyBzcXVhcmUtc3BpbiB7XG4gIDI1JSB7IFxuICAgIHRyYW5zZm9ybTogcGVyc3BlY3RpdmUoMTAwcHgpIHJvdGF0ZVgoMTgwZGVnKSByb3RhdGVZKDApOyBcbiAgfVxuICA1MCUgeyBcbiAgICB0cmFuc2Zvcm06IHBlcnNwZWN0aXZlKDEwMHB4KSByb3RhdGVYKDE4MGRlZykgcm90YXRlWSgxODBkZWcpOyBcbiAgfVxuICA3NSUgeyBcbiAgICB0cmFuc2Zvcm06IHBlcnNwZWN0aXZlKDEwMHB4KSByb3RhdGVYKDApIHJvdGF0ZVkoMTgwZGVnKTsgXG4gIH1cbiAgMTAwJSB7IFxuICAgIHRyYW5zZm9ybTogcGVyc3BlY3RpdmUoMTAwcHgpIHJvdGF0ZVgoMCkgcm90YXRlWSgwKTsgXG4gIH1cbn1cbi4ke2NsYXNzTmFtZX0gPiBkaXYge1xuICBhbmltYXRpb24tZmlsbC1tb2RlOiBib3RoO1xuICB3aWR0aDogNTBweDtcbiAgaGVpZ2h0OiA1MHB4O1xuICBiYWNrZ3JvdW5kOiAjZmZmO1xuICBhbmltYXRpb246IHNxdWFyZS1zcGluIDNzIDBzIGN1YmljLWJlemllcigwLjA5LCAwLjU3LCAwLjQ5LCAwLjkpIGluZmluaXRlO1xufVxuLmFwcC1sb2FkaW5nLXdyYXAge1xuICBwb3NpdGlvbjogZml4ZWQ7XG4gIHRvcDogMDtcbiAgbGVmdDogMDtcbiAgd2lkdGg6IDEwMHZ3O1xuICBoZWlnaHQ6IDEwMHZoO1xuICBkaXNwbGF5OiBmbGV4O1xuICBhbGlnbi1pdGVtczogY2VudGVyO1xuICBqdXN0aWZ5LWNvbnRlbnQ6IGNlbnRlcjtcbiAgYmFja2dyb3VuZDogIzI4MmMzNDtcbiAgei1pbmRleDogOTtcbn1cbiAgICBgO1xuICBjb25zdCBvU3R5bGUgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdzdHlsZScpO1xuICBjb25zdCBvRGl2ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XG5cbiAgb1N0eWxlLmlkID0gJ2FwcC1sb2FkaW5nLXN0eWxlJztcbiAgb1N0eWxlLmlubmVySFRNTCA9IHN0eWxlQ29udGVudDtcbiAgb0Rpdi5jbGFzc05hbWUgPSAnYXBwLWxvYWRpbmctd3JhcCc7XG4gIG9EaXYuaW5uZXJIVE1MID0gYDxkaXYgY2xhc3M9XCIke2NsYXNzTmFtZX1cIj48ZGl2PjwvZGl2PjwvZGl2PmA7XG5cbiAgcmV0dXJuIHtcbiAgICBhcHBlbmRMb2FkaW5nKCkge1xuICAgICAgc2FmZURPTS5hcHBlbmQoZG9jdW1lbnQuaGVhZCwgb1N0eWxlKTtcbiAgICAgIHNhZmVET00uYXBwZW5kKGRvY3VtZW50LmJvZHksIG9EaXYpO1xuICAgIH0sXG4gICAgcmVtb3ZlTG9hZGluZygpIHtcbiAgICAgIHNhZmVET00ucmVtb3ZlKGRvY3VtZW50LmhlYWQsIG9TdHlsZSk7XG4gICAgICBzYWZlRE9NLnJlbW92ZShkb2N1bWVudC5ib2R5LCBvRGl2KTtcbiAgICB9LFxuICB9O1xufVxuXG4vLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG5cbmNvbnN0IHsgYXBwZW5kTG9hZGluZywgcmVtb3ZlTG9hZGluZyB9ID0gdXNlTG9hZGluZygpO1xuZG9tUmVhZHkoKS50aGVuKGFwcGVuZExvYWRpbmcpO1xuXG53aW5kb3cub25tZXNzYWdlID0gKGV2KSA9PiB7XG4gIGV2LmRhdGEucGF5bG9hZCA9PT0gJ3JlbW92ZUxvYWRpbmcnICYmIHJlbW92ZUxvYWRpbmcoKTtcbn07XG5cbnNldFRpbWVvdXQocmVtb3ZlTG9hZGluZywgNDk5OSk7XG4iXSwibmFtZXMiOlsiYXJncyJdLCJtYXBwaW5ncyI6IjtBQUdBLGNBQWMsa0JBQWtCLGVBQWU7QUFBQSxFQUM3QyxpQkFBaUIsQ0FBQyxhQUFzQyxZQUFZLEdBQUcsa0JBQWtCLENBQUMsUUFBUSxVQUFVLFNBQVMsS0FBSyxDQUFDO0FBQUEsRUFDM0gsY0FBYyxDQUFDLFVBQWtCLFlBQVksT0FBTyxpQkFBaUIsS0FBSztBQUFBLEVBQzFFLFVBQVUsQ0FBQyxTQUFnRCxZQUFZLE9BQU8sYUFBYSxJQUFJO0FBQ2pHLENBQUM7QUFFRCxjQUFjLGtCQUFrQixlQUFlO0FBQUEsRUFDN0MsTUFBTSxNQUF5QztBQUN2QyxVQUFBLENBQUMsU0FBUyxRQUFRLElBQUk7QUFDckIsV0FBQSxZQUFZLEdBQUcsU0FBUyxDQUFDLFVBQVVBLFVBQVMsU0FBUyxPQUFPLEdBQUdBLEtBQUksQ0FBQztBQUFBLEVBQzdFO0FBQUEsRUFDQSxPQUFPLE1BQTBDO0FBQy9DLFVBQU0sQ0FBQyxTQUFTLEdBQUcsSUFBSSxJQUFJO0FBQzNCLFdBQU8sWUFBWSxJQUFJLFNBQVMsR0FBRyxJQUFJO0FBQUEsRUFDekM7QUFBQSxFQUNBLFFBQVEsTUFBMkM7QUFDakQsVUFBTSxDQUFDLFNBQVMsR0FBRyxJQUFJLElBQUk7QUFDM0IsV0FBTyxZQUFZLEtBQUssU0FBUyxHQUFHLElBQUk7QUFBQSxFQUMxQztBQUFBLEVBQ0EsVUFBVSxNQUE2QztBQUNyRCxVQUFNLENBQUMsU0FBUyxHQUFHLElBQUksSUFBSTtBQUMzQixXQUFPLFlBQVksT0FBTyxTQUFTLEdBQUcsSUFBSTtBQUFBLEVBQUE7QUFFOUMsQ0FBQztBQUdELFNBQVMsU0FBUyxZQUFrQyxDQUFDLFlBQVksYUFBYSxHQUFHO0FBQ3hFLFNBQUEsSUFBSSxRQUFRLENBQUMsWUFBWTtBQUM5QixRQUFJLFVBQVUsU0FBUyxTQUFTLFVBQVUsR0FBRztBQUMzQyxjQUFRLElBQUk7QUFBQSxJQUFBLE9BQ1A7QUFDSSxlQUFBLGlCQUFpQixvQkFBb0IsTUFBTTtBQUNsRCxZQUFJLFVBQVUsU0FBUyxTQUFTLFVBQVUsR0FBRztBQUMzQyxrQkFBUSxJQUFJO0FBQUEsUUFBQTtBQUFBLE1BQ2QsQ0FDRDtBQUFBLElBQUE7QUFBQSxFQUNILENBQ0Q7QUFDSDtBQUVBLE1BQU0sVUFBVTtBQUFBLEVBQ2QsT0FBTyxRQUFxQixPQUFvQjtBQUMxQyxRQUFBLENBQUMsTUFBTSxLQUFLLE9BQU8sUUFBUSxFQUFFLEtBQUssQ0FBQSxNQUFLLE1BQU0sS0FBSyxHQUFHO0FBQ2hELGFBQUEsT0FBTyxZQUFZLEtBQUs7QUFBQSxJQUFBO0FBQUEsRUFFbkM7QUFBQSxFQUNBLE9BQU8sUUFBcUIsT0FBb0I7QUFDMUMsUUFBQSxNQUFNLEtBQUssT0FBTyxRQUFRLEVBQUUsS0FBSyxDQUFBLE1BQUssTUFBTSxLQUFLLEdBQUc7QUFDL0MsYUFBQSxPQUFPLFlBQVksS0FBSztBQUFBLElBQUE7QUFBQSxFQUNqQztBQUVKO0FBUUEsU0FBUyxhQUFhO0FBQ3BCLFFBQU0sWUFBWTtBQUNsQixRQUFNLGVBQWU7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUEsR0FlcEIsU0FBUztBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBb0JKLFFBQUEsU0FBUyxTQUFTLGNBQWMsT0FBTztBQUN2QyxRQUFBLE9BQU8sU0FBUyxjQUFjLEtBQUs7QUFFekMsU0FBTyxLQUFLO0FBQ1osU0FBTyxZQUFZO0FBQ25CLE9BQUssWUFBWTtBQUNaLE9BQUEsWUFBWSxlQUFlLFNBQVM7QUFFbEMsU0FBQTtBQUFBLElBQ0wsZ0JBQWdCO0FBQ04sY0FBQSxPQUFPLFNBQVMsTUFBTSxNQUFNO0FBQzVCLGNBQUEsT0FBTyxTQUFTLE1BQU0sSUFBSTtBQUFBLElBQ3BDO0FBQUEsSUFDQSxnQkFBZ0I7QUFDTixjQUFBLE9BQU8sU0FBUyxNQUFNLE1BQU07QUFDNUIsY0FBQSxPQUFPLFNBQVMsTUFBTSxJQUFJO0FBQUEsSUFBQTtBQUFBLEVBRXRDO0FBQ0Y7QUFJQSxNQUFNLEVBQUUsZUFBZSxjQUFjLElBQUksV0FBVztBQUNwRCxTQUFTLEVBQUUsS0FBSyxhQUFhO0FBRTdCLE9BQU8sWUFBWSxDQUFDLE9BQU87QUFDdEIsS0FBQSxLQUFLLFlBQVksbUJBQW1CLGNBQWM7QUFDdkQ7QUFFQSxXQUFXLGVBQWUsSUFBSTsifQ==
