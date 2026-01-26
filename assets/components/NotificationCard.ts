import { _decorator, Component, Label, Node } from 'cc';
import { Notification } from '../scripts/types/api.types';

const { ccclass, property, menu } = _decorator;

/**
 * 通知卡片组件
 * 用于显示单个通知的信息
 * 
 * 节点结构：
 * NotificationCard
 * ├── TitleLabel (Label) - 标题
 * ├── ContentLabel (Label) - 内容
 * └── TimeLabel (Label) - 时间
 */
@ccclass('NotificationCard')
@menu('Components/NotificationCard')
export class NotificationCard extends Component {
    // ========== 节点引用 ==========
    @property({ type: Label, tooltip: '标题 Label' })
    titleLabel: Label | null = null;

    @property({ type: Label, tooltip: '内容 Label' })
    contentLabel: Label | null = null;

    @property({ type: Label, tooltip: '时间 Label' })
    timeLabel: Label | null = null;

    // ========== 私有属性 ==========
    private notificationData: Notification | null = null;

    onDestroy() {
        // 清空引用
        this.notificationData = null;
        this.titleLabel = null;
        this.contentLabel = null;
        this.timeLabel = null;
    }

    /**
     * 设置通知数据
     */
    setNotificationData(notification: Notification) {
        this.notificationData = notification;
        this.render();
    }

    /**
     * 渲染卡片内容
     */
    private render() {
        if (!this.notificationData) {
            console.warn('[NotificationCard] 通知数据为空');
            return;
        }

        // 渲染标题
        if (this.titleLabel) {
            this.titleLabel.string = this.notificationData.title;
        }

        // 渲染内容
        if (this.contentLabel) {
            this.contentLabel.string = this.notificationData.content;
        }

        // 渲染时间
        if (this.timeLabel) {
            this.timeLabel.string = this.formatTime(this.notificationData.createdAt);
        }
    }

    /**
     * 格式化时间
     */
    private formatTime(dateString: string): string {
        try {
            const date = new Date(dateString);
            const now = new Date();
            const diff = now.getTime() - date.getTime();

            // 小于1分钟
            if (diff < 60 * 1000) {
                return '刚刚';
            }

            // 小于1小时
            if (diff < 60 * 60 * 1000) {
                const minutes = Math.floor(diff / (60 * 1000));
                return `${minutes}分钟前`;
            }

            // 小于1天
            if (diff < 24 * 60 * 60 * 1000) {
                const hours = Math.floor(diff / (60 * 60 * 1000));
                return `${hours}小时前`;
            }

            // 小于7天
            if (diff < 7 * 24 * 60 * 60 * 1000) {
                const days = Math.floor(diff / (24 * 60 * 60 * 1000));
                return `${days}天前`;
            }

            // 显示具体日期
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const day = String(date.getDate()).padStart(2, '0');
            const hour = String(date.getHours()).padStart(2, '0');
            const minute = String(date.getMinutes()).padStart(2, '0');

            // 同一年只显示月日
            if (year === now.getFullYear()) {
                return `${month}-${day} ${hour}:${minute}`;
            }

            return `${year}-${month}-${day} ${hour}:${minute}`;
        } catch (error) {
            console.error('[NotificationCard] 时间格式化失败:', error);
            return dateString;
        }
    }

    /**
     * 获取通知数据
     */
    getNotificationData(): Notification | null {
        return this.notificationData;
    }
}
