import { INotification } from '../modules/Notification/notification.interface';
import Notification from '../modules/Notification/notification.model';
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
