import { Types } from 'mongoose';
import Auth from '../modules/Auth/auth.model';
import Conversation from '../modules/Conversation/conversation.model';
import { onlineUsers } from '../socket/socketConnection';

interface ConversationQuery {
  searchTerm?: string;
  page?: string | number;
  limit?: string | number;
}

export const getConversationList = async (
  userId: string,
  query: ConversationQuery
) => {
  const userObjectId = new Types.ObjectId(userId);
  const searchTerm = query.searchTerm as string;
  const page = parseInt(query.page as string, 10) || 1;
  const limit = parseInt(query.limit as string, 10) || 15;
  const skip = (page - 1) * limit;

  let userFilter: Record<string, unknown> = {};
  if (searchTerm) {
    const matchingUsers = await Auth.find(
      { name: { $regex: searchTerm, $options: 'i' } },
      '_id'
    );
    const matchingUserIds = matchingUsers.map((u) => u._id);
    if (matchingUserIds.length > 0) {
      userFilter = { participants: { $in: matchingUserIds } };
    } else {
      userFilter = { _id: null };
    }
  }

  const onlineUserIds = Array.from(onlineUsers.keys()).map(
    (id) => new Types.ObjectId(id)
  );

  const conversations = await Conversation.aggregate([
    { $match: { participants: userObjectId, ...userFilter } },

    {
      $facet: {
        metadata: [{ $count: 'total' }],
        data: [
          { $sort: { updatedAt: -1 } },
          { $skip: skip },
          { $limit: limit },

          // Lookup participants
          {
            $lookup: {
              from: 'users',
              localField: 'participants',
              foreignField: '_id',
              as: 'participantsData',
            },
          },
          // Lookup last message
          {
            $lookup: {
              from: 'messages',
              localField: 'lastMessage',
              foreignField: '_id',
              as: 'lastMessageData',
            },
          },
          {
            $unwind: {
              path: '$lastMessageData',
              preserveNullAndEmptyArrays: true,
            },
          },
          // Count unseen messages
          {
            $lookup: {
              from: 'messages',
              let: { convId: '$_id' },
              pipeline: [
                { $match: { $expr: { $eq: ['$conversationId', '$$convId'] } } },
                { $match: { msgByUser: { $ne: userObjectId }, seen: false } },
                { $count: 'unseenCount' },
              ],
              as: 'unseenData',
            },
          },
          {
            $addFields: {
              unseenMsg: { $arrayElemAt: ['$unseenData.unseenCount', 0] },
              otherUser: {
                $arrayElemAt: [
                  {
                    $filter: {
                      input: '$participantsData',
                      cond: { $ne: ['$$this._id', userObjectId] },
                    },
                  },
                  0,
                ],
              },
            },
          },
          {
            $project: {
              conversationId: '$_id',
              unseenMsg: { $ifNull: ['$unseenMsg', 0] },
              userData: {
                userId: '$otherUser._id',
                name: '$otherUser.name',
                profileImage: '$otherUser.photo',
                online: {
                  $in: ['$otherUser._id', { $literal: onlineUserIds }],
                },
              },
              lastMsg: {
                $cond: {
                  if: {
                    $and: [
                      { $ne: ['$lastMessageData.text', null] },
                      { $ne: ['$lastMessageData.text', ''] },
                    ],
                  },
                  then: '$lastMessageData.text',
                  else: {
                    $cond: {
                      if: {
                        $and: [
                          { $ne: ['$lastMessageData.audioUrl', null] },
                          { $ne: ['$lastMessageData.audioUrl', ''] },
                        ],
                      },
                      then: 'sent an audio file',
                      else: {
                        $cond: {
                          if: {
                            $gt: [
                              {
                                $size: {
                                  $ifNull: ['$lastMessageData.imageUrl', []],
                                },
                              },
                              0,
                            ],
                          },
                          then: {
                            $concat: [
                              'sent ',
                              {
                                $toString: {
                                  $size: {
                                    $ifNull: ['$lastMessageData.imageUrl', []],
                                  },
                                },
                              },
                              ' image(s)',
                            ],
                          },
                          else: '[unsupported message]',
                        },
                      },
                    },
                  },
                },
              },

              lastMsgCreatedAt: '$lastMessageData.createdAt',
            },
          },
        ],
      },
    },
  ]);

  const total = conversations[0].metadata[0]?.total || 0;
  const totalPages = Math.ceil(total / limit);

  return {
    meta: {
      total,
      page,
      limit,
      totalPages,
    },
    conversations: conversations[0].data,
  };
};
