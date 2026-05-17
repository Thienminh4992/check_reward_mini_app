// "use client"
//
// import { useState } from "react"
// import { Reward } from "@/types/reward"
//
// interface Props {
//     reward: Reward
//     userPoints: number
//     onRedeem: (id: string, quantity: number) => void
// }
//
// export default function RewardCard({ reward, userPoints, onRedeem }: Props) {
//     const [quantity, setQuantity] = useState(1)
//     const [showError, setShowError] = useState(false)
//     const [showForm, setShowForm] = useState(false)
//         name: "",
//         phone: "",
//         address: ""
//     })
//
//     const totalPoints = reward.required_points * quantity
//
//     const increase = () => {
//         if (quantity < reward.stock) setQuantity(q => q + 1)
//     }
//
//     const decrease = () => {
//         if (quantity > 1) setQuantity(q => q - 1)
//     }
//
//     const handleRedeemClick = () => {
//         if (reward.stock < quantity || userPoints < totalPoints) {
//             setShowError(true)
//             return
//         }
//         setShowForm(true)
//     }
//
//     const handleSubmit = () => {
//         if (!shippingInfo.name || !shippingInfo.phone || !shippingInfo.address) {
//             alert("Vui lòng nhập đầy đủ thông tin")
//             return
//         }
//
//         onRedeem(reward.id, quantity, shippingInfo)
//         setShowForm(false)
//     }
//
//     return (
//         <>
//             <div className="bg-white rounded-xl shadow-sm hover:shadow-md transition p-3 flex flex-col scale-[0.75] origin-top">
//                 <div className="flex gap-3">
//                     <div className="flex-1 min-w-0">
//                         <h5 className="font-semibold text-gray-800 text-sm leading-tight">
//                             {reward.name}
//                         </h5>
//
//                         <p className="text-[11px] text-gray-500 mt-1 line-clamp-2 leading-snug">
//                             {reward.description}
//                         </p>
//
//                         <div className="mt-2 flex items-center gap-2 flex-wrap">
//                         <span className="text-blue-600 font-semibold text-xs">
//                             {reward.required_points} điểm
//                         </span>
//
//                             <span className="text-gray-400 text-[10px]">
//                             Còn {reward.stock}
//                         </span>
//                         </div>
//                     </div>
//
//                     <div className="w-[72px] aspect-square rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
//                         <img
//                             src={reward.image_url}
//                             alt={reward.name}
//                             className="w-full h-full object-cover"
//                         />
//                     </div>
//                 </div>
//
//                 <div className="mt-2 flex items-center justify-between gap-2">
//                     <div className="flex items-center bg-gray-100 rounded-full px-1 py-[2px] shadow-inner">
//                         <button
//                             onClick={decrease}
//                             disabled={quantity === 1}
//                             className={`w-5 h-5 flex items-center justify-center rounded-full text-[11px] transition ${
//                                 quantity === 1
//                                     ? "text-gray-300"
//                                     : "hover:bg-gray-200"
//                             }`}
//                         >
//                             -
//                         </button>
//
//                         <span className="w-5 text-center font-medium text-[10px]">
//                             {quantity}
//                         </span>
//
//                         <button
//                             onClick={increase}
//                             disabled={quantity === reward.stock}
//                             className={`w-5 h-5 flex items-center justify-center rounded-full text-[11px] transition ${
//                                 quantity === reward.stock
//                                     ? "text-gray-300"
//                                     : "hover:bg-gray-200"
//                             }`}
//                         >
//                             +
//                         </button>
//                     </div>
//
//                     <button
//                         onClick={handleRedeemClick}
//                         disabled={reward.stock === 0}
//                         className={`px-2.5 py-1 text-[10px] font-medium rounded-md leading-none transition ${
//                             reward.stock === 0
//                                 ? "bg-gray-300 text-white cursor-not-allowed"
//                                 : "bg-gradient-to-r from-blue-500 to-blue-600 text-white hover:shadow active:scale-95"
//                         }`}
//                     >
//                         {reward.stock === 0 ? "Hết hàng" : "Đổi ngay"}
//                     </button>
//                 </div>
//             </div>
//
//             {/* Modal lỗi */}
//             {showError && (
//                 <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
//                     <div className="bg-white rounded-2xl p-6 w-[320px] shadow-xl text-center">
//                         <h2 className="text-lg font-semibold text-red-500 mb-2">
//                             Không đủ điểm
//                         </h2>
//
//                         <p className="text-gray-600 mb-4 text-sm">
//                             Bạn cần <b>{totalPoints}</b> điểm nhưng hiện chỉ có{" "}
//                             <b>{userPoints}</b> điểm.
//                         </p>
//
//                         <button
//                             onClick={() => setShowError(false)}
//                             className="px-4 py-2 bg-blue-500 text-white rounded-xl text-sm"
//                         >
//                             Đóng
//                         </button>
//                     </div>
//                 </div>
//             )}
//
//             {/* Modal form nhận quà */}
//             {showForm && (
//                 <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
//                     <div className="bg-white rounded-2xl p-5 w-[340px] shadow-xl">
//                         <h2 className="text-base font-semibold mb-4">
//                             Xác nhận đổi quà
//                         </h2>
//
//                         <div className="mt-5 flex justify-end gap-3">
//                             <button
//                                 onClick={() => setShowForm(false)}
//                                 className="px-3 py-2 rounded-xl bg-gray-200 text-sm"
//                             >
//                                 Huỷ
//                             </button>
//
//                             <button
//                                 onClick={handleSubmit}
//                                 className="px-3 py-2 rounded-xl bg-blue-500 text-white text-sm"
//                             >
//                                 Xác nhận
//                             </button>
//                         </div>
//                     </div>
//                 </div>
//             )}
//         </>
//     )
// }