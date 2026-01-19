import { _decorator, Component } from 'cc';
const { ccclass, menu } = _decorator;

@ccclass('RenderLogout')
@menu('Components/RenderLogout')
export class RenderLogout extends Component {
    /**
     * 打开面板
     */
    open() {
        this.node.active = true;
    }

    /**
     * 关闭面板
     */
    close() {
        this.node.active = false;
    }

    /**
     * 登出（预留）
     */
    logout() {
        // TODO: 实现登出逻辑
    }
}
