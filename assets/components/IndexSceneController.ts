import { _decorator, Component } from 'cc';
import { WndManager } from '../scripts/core/WndManager';

const { ccclass, property, menu } = _decorator;

/**
 * Index 场景控制器
 * 挂在 index 场景的 Canvas 上，场景启动时自动打开默认 Wnd
 */
@ccclass('IndexSceneController')
@menu('Components/IndexSceneController')
export class IndexSceneController extends Component {

    @property({ tooltip: '场景启动时默认打开的 Wnd 名称' })
    defaultWndName: string = 'selectCardWnd';

    async start() {
        if (!this.defaultWndName) {
            console.warn('[IndexSceneController] defaultWndName 为空，跳过');
            return;
        }

        console.log(`[IndexSceneController] 打开默认界面: ${this.defaultWndName}`);
        await WndManager.instance.open(this.defaultWndName);
    }
}
