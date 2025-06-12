import React, { useMemo } from 'react';
import { CastMethod, CastRtfContentType, type CastGift, type CastRtfContent, type CastUser } from '../core/dycast';
import { emojis } from '../core/emoji';
import './CastItem.scss';

interface CastContentDOM {
  node: 'text' | 'icon' | 'emoji';
  url?: string;
  text?: string;
}

interface CastItemProps {
  method?: CastMethod;
  user?: CastUser;
  gift?: CastGift;
  content?: string;
  rtfContent?: CastRtfContent[];
}

const CastItem: React.FC<CastItemProps> = ({
  method,
  user,
  gift,
  content,
  rtfContent
}) => {
  /**
   * 创建普通内容
   */
  const createTextContent = (content?: string): CastContentDOM[] => {
    if (!content) return [];
    const list: CastContentDOM[] = [];
    const cns = content.split(/(\[.*?])/);
    for (let i = 0; i < cns.length; i++) {
      const item = cns[i];
      if (!item) continue;
      if (emojis[item]) {
        list.push({ node: 'icon', text: item, url: emojis[item] });
      } else {
        list.push({
          node: 'text',
          text: item
        });
      }
    }
    return list;
  };

  /**
   * 创建富文本内容
   */
  const createRtfContent = (content?: CastRtfContent[]): CastContentDOM[] => {
    if (!content) return [];
    const list: CastContentDOM[] = [];
    for (let i = 0; i < content.length; i++) {
      const item = content[i];
      switch (content[i].type) {
        case CastRtfContentType.TEXT:
          list.push(...createTextContent(item.text));
          break;
        case CastRtfContentType.EMOJI:
          list.push({
            node: 'icon',
            text: item.text,
            url: item.url
          });
          break;
      }
    }
    return list;
  };

  const doms = useMemo(() => {
    let list: CastContentDOM[] = [];
    switch (method) {
      case CastMethod.CHAT:
        if (rtfContent) list = createRtfContent(rtfContent);
        else list = createTextContent(content);
        break;
      case CastMethod.GIFT:
        if (gift) {
          list = [
            {
              node: 'text',
              text: '送出了'
            },
            {
              node: 'icon',
              text: gift.name,
              url: gift.icon
            },
            {
              node: 'text',
              text: `× ${gift.count}`
            }
          ];
        } else {
          list = [
            {
              node: 'text',
              text: '送出了礼物'
            }
          ];
        }
        break;
      case CastMethod.EMOJI_CHAT:
        list = [
          {
            node: 'emoji',
            text: '会员表情',
            url: content
          }
        ];
        break;
      default:
        list = [
          {
            node: 'text',
            text: content
          }
        ];
    }
    return list;
  }, [method, rtfContent, content, gift]);

  const getClassName = () => {
    const baseClass = 'cast-item';
    const methodClasses = {
      [CastMethod.GIFT]: 'gift-cast',
      [CastMethod.CHAT]: 'chat-cast',
      [CastMethod.LIKE]: 'like-cast',
      [CastMethod.SOCIAL]: 'social-cast',
      [CastMethod.MEMBER]: 'member-cast',
      [CastMethod.EMOJI_CHAT]: 'emoji-cast',
      [CastMethod.CUSTOM]: 'custom-cast'
    };
    
    const methodClass = method ? methodClasses[method] : '';
    return `${baseClass} ${methodClass}`.trim();
  };

  return (
    <div className={getClassName()}>
      <span className="prefix">$</span>
      <p className="content">
        <label className="nickname">[{user?.name ? user.name : 'unknown'}]：</label>
        {doms.map((item, index) => {
          if (item.node === 'text') {
            return <span key={index} className="text">{item.text}</span>;
          } else if (item.node === 'icon') {
            return <img key={index} className="icon" title={item.text} src={item.url} alt={item.text} />;
          } else if (item.node === 'emoji') {
            return <img key={index} className="emoji" alt="会员表情" src={item.url} />;
          }
          return null;
        })}
      </p>
    </div>
  );
};

export default CastItem;
