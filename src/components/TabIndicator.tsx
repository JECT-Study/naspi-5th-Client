// 선택된 탭 칸 아래의 밑줄 (칸 전체 폭, 2px NSBlue). 칸에 getTabClassName(relative)을 붙이고 안에 둔다
function TabIndicator() {
  return <span aria-hidden="true" className="absolute inset-x-0 bottom-0 h-0.5 bg-ns-blue" />;
}

export default TabIndicator;
