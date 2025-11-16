import FileUploadComponent from "./components/file-upload";
import ChatComponent from "./components/chat";

export default function Home() {
  return (
    <div className="min-h-screen w-full bg-gradient-to-b from-[#f9fafb] to-[#eef1f5] p-10">

      {/* CENTERED WORKSPACE */}
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8">

        {/* LEFT PANEL */}
        <div className="bg-white border border-gray-200 shadow-sm rounded-2xl p-6 h-fit">
          <FileUploadComponent />
        </div>

        {/* RIGHT PANEL */}
        <div className="bg-white border border-gray-200 shadow-sm rounded-2xl p-6 h-[80vh] flex flex-col">
          <ChatComponent />
        </div>

      </div>
    </div>
  );
}
