import { _decorator, Component, Node, NodeEventType } from 'cc';
import { Navigator } from '../scripts/core/Navigator';

const { ccclass, property, menu } = _decorator;

/**
 * Header 控制器
 * 直接放到具体的 wnd 界面中使用
 *
 * 节点结构：
 * header (本脚本挂载于此)
 * └── main
 *      ├── icon-setting    → 打开 settingWndName
 *      ├── icon-notive     → 打开 notificationWndName
 *      ├── icon-back       → 关闭当前界面（返回上一级）
 *      └── bg-coins        → 金币显示
 *
 * 使用方式：
 * 将 header 预制体拖入需要的 wnd prefab 中，
 * 在编辑器中按需显示/隐藏 icon-back、bg-coins 等子节点。
 */
@ccclass('HeaderController')
@menu('Components/HeaderController')
export class HeaderController extends Component {
    @property({ tooltip: 'icon-setting 打开的目标 Wnd 名称（留空则不响应点击）' })
    settingWndName: string = 'settingWnd';

    @property({ tooltip: 'icon-notive 打开的目标 Wnd 名称（留空则不响应点击）' })
    notificationWndName: string = 'notificationsWnd';

    private _iconBack: Node | null = null;
    private _iconSetting: Node | null = null;
    private _iconNotive: Node | null = null;
    private _loading: boolean = false;

    onLoad() {
        const main = this.node.getChildByName('main');
        if (!main) {
            console.warn('[HeaderController] 找不到 main 子节点');
            return;
        }
        this._iconBack = main.getChildByName('icon-back');
        this._iconSetting = main.getChildByName('icon-setting');
        this._iconNotive = main.getChildByName('icon-notive');
    }

    onEnable() {
        this._iconBack?.on(NodeEventType.TOUCH_END, this._onBackClick, this);
        this._iconSetting?.on(NodeEventType.TOUCH_END, this._onSettingClick, this);
        this._iconNotive?.on(NodeEventType.TOUCH_END, this._onNotiveClick, this);
    }

    onDisable() {
        this._iconBack?.off(NodeEventType.TOUCH_END, this._onBackClick, this);
        this._iconSetting?.off(NodeEventType.TOUCH_END, this._onSettingClick, this);
        this._iconNotive?.off(NodeEventType.TOUCH_END, this._onNotiveClick, this);
    }

    private _onBackClick() {
        if (this._loading) return;
        Navigator.back();
    }

    private _onSettingClick() {
        if (this._loading || !this.settingWndName) return;
        this._navigateTo(this.settingWndName);
    }

    private _onNotiveClick() {
        if (this._loading || !this.notificationWndName) return;
        this._navigateTo(this.notificationWndName);
    }

    private _navigateTo(wndName: string) {
        this._loading = true;
        Navigator.toWnd(wndName).then(() => {
            this._loading = false;
        }).catch(() => {
            this._loading = false;
        });
    }
}
