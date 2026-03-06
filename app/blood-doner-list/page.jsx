import { donersData } from "../data";
export default function BloodDonerList() {
  return (
    <div className="min-h-screen max-w-5xl mx-auto p-3 bg-zinc-50">
      <h1 className="text-2xl text-center mt-3 mb-8">Donar Blood List</h1>
      {/* Search Donar */}
      <div className="w-full  gap-3">
        <input
          type="text"
          className="w-2/3 border p-1"
          placeholder="Seach Donar By Name, Village, and Institue"
        />

        <div className="mt-3 w-1/3 flex gap-3">
          <button className=" bg-amber-600 px-1 rounded-sm text-white">
            List View
          </button>
          <button className="bg-red-400 px-1 rounded-sm text-white">
            Grid View
          </button>
        </div>
      </div>

      <div className="mt-3 grid grid-cols-4">
        {donersData.map((doner, index) => (
          <div key={index} className="shadow-md p-3">
            <p>{doner.name}</p>
            <p>{doner.bloodGroup}</p>
            <p>{doner.mobile}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
