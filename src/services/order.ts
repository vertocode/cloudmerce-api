import Order from "../models/Order";
import mongoose from "mongoose";

interface IGetOrderById {
  orderId: string;
  ecommerceId: string;
}

export const getOrderById = async ({ orderId, ecommerceId }: IGetOrderById) => {
  const order = await Order.findById({ _id: orderId, ecommerceId }).populate(
    "items.productId",
  );
  if (!order) {
    throw new Error("Pedido não encontrado.");
  }

  return order;
};

interface IGetOrdersByUserId {
  userId: string;
  ecommerceId: string;
}

export const getOrdersByUserId = async ({
  userId,
  ecommerceId,
}: IGetOrdersByUserId) => {
  try {
    console.log("Valor do userId:", userId);

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      throw new Error("userId inválido");
    }

    const objectIdUser = new mongoose.Types.ObjectId(userId);

    console.log(
      "Consultando pedidos com userId:",
      objectIdUser,
      "ecommerceId:",
      ecommerceId,
    );

    const orders = await Order.find({
      userId: objectIdUser,
      ecommerceId,
    }).populate("items.productId");

    if (!orders || orders.length === 0) {
      console.log("Nenhum pedido encontrado para esse userId e ecommerceId");
    }

    return orders || [];
  } catch (err) {
    console.error(err);
    throw new Error("Erro ao buscar pedidos");
  }
};
