import React, { useState, useRef, useCallback } from 'react';
import ConnectInput from '../components/ConnectInput';
import LiveInfo from '../components/LiveInfo';
import LiveStatusPanel from '../components/LiveStatusPanel';
import CastList from '../components/CastList';
import {
  CastMethod,
  DyCast,
  DyCastCloseCode,
  RoomStatus,
  type ConnectStatus,
  type DyLiveInfo,
  type DyMessage,
  type LiveRoom
} from '../core/dycast';
import { verifyRoomNum, verifyWsUrl } from '../utils/verifyUtil';
import { CLog } from '../utils/logUtil';
import { getId } from '../utils/idUtil';
import { RelayCast } from '../core/relay';
import SkMessage from '../components/Message';
import { formatDate } from '../utils/commonUtil';
import FileSaver from '../utils/fileUtil';
import './IndexView.scss';

const IndexView: React.FC = () => {
  // 连接状态
  const [connectStatus, setConnectStatus] = useState<ConnectStatus>(0);
  // 转发状态
  const [relayStatus, setRelayStatus] = useState<ConnectStatus>(0);
  // 房间号
  const [roomNum, setRoomNum] = useState<string>('');
  // 转发地址
  const [relayUrl, setRelayUrl] = useState<string>('');

  // 直播间信息
  const [cover, setCover] = useState<string>('');
  const [title, setTitle] = useState<string>('*****');
  const [avatar, setAvatar] = useState<string>('');
  const [nickname, setNickname] = useState<string>('***');
  const [followCount, setFollowCount] = useState<string | number>('*****');
  const [memberCount, setMemberCount] = useState<string | number>('*****');
  const [userCount, setUserCount] = useState<string | number>('*****');
  const [likeCount, setLikeCount] = useState<string | number>('*****');

  // Refs
  const roomInputRef = useRef<any>(null);
  const relayInputRef = useRef<any>(null);
  const statusPanelRef = useRef<any>(null);
  const castRef = useRef<any>(null);
  const otherRef = useRef<any>(null);

  // 所有弹幕
  const allCastsRef = useRef<DyMessage[]>([]);
  // 记录弹幕
  const castSetRef = useRef<Set<string>>(new Set());
  // 弹幕客户端
  const castWsRef = useRef<DyCast | undefined>();
  // 转发客户端
  const relayWsRef = useRef<RelayCast | undefined>();

  /**
   * 验证房间号
   */
  const verifyRoomNumber = useCallback((value: string) => {
    const flag = verifyRoomNum(value);
    if (flag) return { flag, message: '' };
    else {
      return { flag, message: '房间号错误' };
    }
  }, []);

  /**
   * 验证转发地址 WsUrl
   */
  const verifyWssUrl = useCallback((value: string) => {
    const flag = verifyWsUrl(value);
    if (flag) return { flag, message: '' };
    else {
      return { flag, message: '转发地址错误' };
    }
  }, []);

  /** 设置房间号输入框状态 */
  const setRoomInputStatus = useCallback((flag?: boolean) => {
    if (roomInputRef.current) roomInputRef.current.setStatus(flag);
  }, []);

  /** 设置转发地址输入框状态 */
  const setRelayInputStatus = useCallback((flag?: boolean) => {
    if (relayInputRef.current) relayInputRef.current.setStatus(flag);
  }, []);

  /**
   * 设置房间统计信息
   */
  const setRoomCount = useCallback((room?: LiveRoom) => {
    if (!room) return;
    if (room.audienceCount) setMemberCount(`${room.audienceCount}`);
    if (room.followCount) setFollowCount(`${room.followCount}`);
    if (room.likeCount) setLikeCount(`${room.likeCount}`);
    if (room.totalUserCount) setUserCount(`${room.totalUserCount}`);
  }, []);

  /**
   * 设置直播间信息
   */
  const setRoomInfo = useCallback((info?: DyLiveInfo) => {
    if (!info) return;
    if (info.cover) setCover(info.cover);
    if (info.title) setTitle(info.title);
    if (info.avatar) setAvatar(info.avatar);
    if (info.nickname) setNickname(info.nickname);
  }, []);

  /**
   * 处理消息列表
   */
  const handleMessages = useCallback((msgs: DyMessage[]) => {
    const newCasts: DyMessage[] = [];
    const mainCasts: DyMessage[] = [];
    const otherCasts: DyMessage[] = [];
    
    try {
      for (const msg of msgs) {
        if (!msg.id) continue;
        if (castSetRef.current.has(msg.id)) continue;
        castSetRef.current.add(msg.id);
        
        switch (msg.method) {
          case CastMethod.CHAT:
            newCasts.push(msg);
            mainCasts.push(msg);
            break;
          case CastMethod.GIFT:
            if (!msg?.gift?.repeatEnd) {
              newCasts.push(msg);
              mainCasts.push(msg);
            }
            break;
          case CastMethod.LIKE:
            newCasts.push(msg);
            otherCasts.push(msg);
            setRoomCount(msg.room);
            break;
          case CastMethod.MEMBER:
            newCasts.push(msg);
            otherCasts.push(msg);
            setRoomCount(msg.room);
            break;
          case CastMethod.SOCIAL:
            newCasts.push(msg);
            otherCasts.push(msg);
            setRoomCount(msg.room);
            break;
          case CastMethod.EMOJI_CHAT:
            newCasts.push(msg);
            mainCasts.push(msg);
            break;
          case CastMethod.ROOM_USER_SEQ:
            setRoomCount(msg.room);
            break;
          case CastMethod.ROOM_STATS:
            setRoomCount(msg.room);
            break;
          case CastMethod.CONTROL:
            if (msg?.room?.status !== RoomStatus.LIVING) {
              // 已经下播
              newCasts.push(msg);
              otherCasts.push(msg);
              disconnectLive();
            }
            break;
        }
      }
    } catch (err) {}
    
    // 记录
    allCastsRef.current.push(...newCasts);
    if (castRef.current) castRef.current.appendCasts(mainCasts);
    if (otherRef.current) otherRef.current.appendCasts(otherCasts);
    if (relayWsRef.current && relayWsRef.current.isConnected()) {
      relayWsRef.current.send(JSON.stringify(msgs));
    }
  }, [setRoomCount]);

  /**
   * 添加控制台消息
   */
  const addConsoleMessage = useCallback((content: string) => {
    if (otherRef.current)
      otherRef.current.appendCasts([
        {
          id: getId(),
          method: CastMethod.CUSTOM,
          content,
          user: { name: '控制台' }
        }
      ]);
  }, []);

  /**
   * 清理列表
   */
  const clearMessageList = useCallback(() => {
    castSetRef.current.clear();
    allCastsRef.current.length = 0;
    if (castRef.current) castRef.current.clearCasts();
    if (otherRef.current) otherRef.current.clearCasts();
  }, []);

  /**
   * 连接房间
   */
  const connectLive = useCallback(() => {
    try {
      // 清空上一次连接的消息
      clearMessageList();
      CLog.debug('正在连接:', roomNum);
      SkMessage.info(`正在连接：${roomNum}`);
      const cast = new DyCast(roomNum);
      
      cast.on('open', (ev, info) => {
        CLog.info('DyCast 房间连接成功');
        SkMessage.success(`房间连接成功[${roomNum}]`);
        setRoomInputStatus(true);
        setConnectStatus(1);
        setRoomInfo(info);
        addConsoleMessage('直播间已连接');
      });
      
      cast.on('error', err => {
        CLog.error('DyCast 连接出错 =>', err);
        SkMessage.error(`连接出错: ${err}`);
        setConnectStatus(2);
        setRoomInputStatus(false);
      });
      
      cast.on('close', (code, reason) => {
        CLog.info(`DyCast 房间已关闭[${code}] => ${reason}`);
        setConnectStatus(3);
        setRoomInputStatus(false);
        
        switch (code) {
          case DyCastCloseCode.NORMAL:
            SkMessage.success('断开成功');
            break;
          case DyCastCloseCode.LIVE_END:
            SkMessage.info('主播已下播');
            break;
          case DyCastCloseCode.CANNOT_RECEIVE:
            SkMessage.error('无法正常接收信息，已关闭');
            break;
          default:
            SkMessage.info('房间已关闭');
        }
        
        if (code === DyCastCloseCode.LIVE_END) {
          addConsoleMessage(reason || '主播尚未开播或已下播');
        } else {
          if (statusPanelRef.current) addConsoleMessage(`连接已关闭，共持续: ${statusPanelRef.current.getDuration()}`);
          else addConsoleMessage('连接已关闭');
        }
      });
      
      cast.on('message', msgs => {
        handleMessages(msgs);
      });
      
      cast.on('reconnecting', (count, code, reason) => {
        switch (code) {
          case DyCastCloseCode.CANNOT_RECEIVE:
            SkMessage.warning('无法正常接收弹幕，准备重连中');
            break;
          default:
            CLog.warn('DyCast 重连中 =>', count);
            SkMessage.warning(`正在重连中: ${count}`);
        }
      });
      
      cast.on('reconnect', ev => {
        CLog.info('DyCast 重连成功');
        SkMessage.success('房间重连完成');
      });
      
      cast.connect();
      castWsRef.current = cast;
    } catch (err) {
      CLog.error('房间连接过程出错:', err);
      SkMessage.error('房间连接过程出错');
      setRoomInputStatus(false);
      castWsRef.current = undefined;
    }
  }, [roomNum, clearMessageList, setRoomInputStatus, setRoomInfo, addConsoleMessage, handleMessages]);

  /** 断开连接 */
  const disconnectLive = useCallback(() => {
    if (castWsRef.current) castWsRef.current.close(1000, '断开连接');
  }, []);

  /** 连接转发房间 */
  const relayCast = useCallback(() => {
    try {
      CLog.info('正在连接转发中 =>', relayUrl);
      SkMessage.info(`转发连接中: ${relayUrl}`);
      const cast = new RelayCast(relayUrl);
      
      cast.on('open', () => {
        CLog.info(`DyCast 转发连接成功`);
        SkMessage.success(`已开始转发`);
        setRelayInputStatus(true);
        setRelayStatus(1);
        addConsoleMessage('转发客户端已连接');
        if (castWsRef.current) {
          // 发送直播间信息给转发地址
          cast.send(JSON.stringify(castWsRef.current.getLiveInfo()));
        }
      });
      
      cast.on('close', (code, msg) => {
        CLog.info(`(${code})dycast 转发已关闭: ${msg || '未知原因'}`);
        if (code === 1000) SkMessage.info(`已停止转发`);
        else SkMessage.warning(`转发已停止: ${msg || '未知原因'}`);
        setRelayInputStatus(false);
        setRelayStatus(0);
        addConsoleMessage('转发已关闭');
      });
      
      cast.on('error', ev => {
        CLog.warn(`dycast 转发出错: ${ev.message}`);
        SkMessage.error(`转发出错了: ${ev.message}`);
        setRelayInputStatus(false);
        setRelayStatus(2);
      });
      
      cast.connect();
      relayWsRef.current = cast;
    } catch (err) {
      CLog.error('弹幕转发出错:', err);
      SkMessage.error('转发出错: ${err.message}');
      setRelayInputStatus(false);
      setRelayStatus(2);
      relayWsRef.current = undefined;
    }
  }, [relayUrl, setRelayInputStatus, addConsoleMessage]);

  /** 暂停转发 */
  const stopRelayCast = useCallback(() => {
    if (relayWsRef.current) relayWsRef.current.close(1000);
  }, []);

  /** 将弹幕保存到本地文件 */
  const saveCastToFile = useCallback(() => {
    if (connectStatus === 1) {
      SkMessage.warning('请断开连接后再保存');
      return;
    }
    const len = allCastsRef.current.length;
    if (len <= 0) {
      SkMessage.warning('暂无弹幕需要保存');
      return;
    }
    const date = formatDate(new Date(), 'yyyy-MM-dd_HHmmss');
    const fileName = `[${roomNum}]${date}(${len})`;
    const data = JSON.stringify(allCastsRef.current, null, 2);
    
    FileSaver.save(data, {
      name: fileName,
      ext: '.json',
      mimeType: 'application/json',
      description: '弹幕数据',
      existStrategy: 'new'
    })
      .then(res => {
        if (res.success) {
          SkMessage.success('弹幕保存成功');
        } else {
          SkMessage.error('弹幕保存失败');
          CLog.error('弹幕保存失败 =>', res.message);
        }
      })
      .catch(err => {
        SkMessage.error('弹幕保存出错了');
        CLog.error('弹幕保存出错了 =>', err);
      });
  }, [connectStatus, roomNum]);

  return (
    <div className="index-view">
      <div className="view-left">
        <LiveInfo
          cover={cover}
          title={title}
          avatar={avatar}
          nickname={nickname}
          followCount={followCount}
          memberCount={memberCount}
          userCount={userCount}
          likeCount={likeCount}
        />
        <div className="view-left-bottom">
          <div className="view-left-tools">
            <div className="view-left-tool" title="保存弹幕" onClick={saveCastToFile}>
              <i className="ice-save"></i>
            </div>
          </div>
          <hr className="hr" />
          <LiveStatusPanel ref={statusPanelRef} status={connectStatus} />
        </div>
      </div>
      <div className="view-center">
        {/* 主要弹幕：聊天、礼物 */}
        <CastList types={['chat', 'gift']} ref={castRef} />
      </div>
      <div className="view-right">
        <div className="view-input">
          <ConnectInput
            ref={roomInputRef}
            label="房间号"
            placeholder="请输入房间号"
            value={roomNum}
            onChange={setRoomNum}
            test={verifyRoomNumber}
            onConfirm={connectLive}
            onCancel={disconnectLive}
          />
          <ConnectInput
            ref={relayInputRef}
            label="WS地址"
            placeholder="请输入转发地址"
            confirmText="转发"
            cancelText="停止"
            value={relayUrl}
            onChange={setRelayUrl}
            test={verifyWssUrl}
            onConfirm={relayCast}
            onCancel={stopRelayCast}
          />
        </div>
        <div className="view-other">
          {/* 其它弹幕：关注、点赞、进入、控制台等 */}
          <CastList ref={otherRef} types={['social', 'like', 'member']} pos="left" noPrefix theme="dark" />
        </div>
      </div>
    </div>
  );
};

export default IndexView;
