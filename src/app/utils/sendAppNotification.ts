import { INotification } from '../modules/notificationModule/notification.interface';
import Notification from '../modules/notificationModule/notification.model';
import { getSocketIO } from '../socket/connectSocket';
import getUserNotificationCount from './getUnseenNotificationCount';

const sendNotification = async (notificationData: INotification) => {
  const io = getSocketIO();
  await Notification.create(notificationData);

  const updatedNotification = await getUserNotificationCount(
    notificationData.receiver.toString()
  );

  io.to(notificationData.receiver.toString()).emit(
    'notification',
    updatedNotification
  );
};

export default sendNotification;
