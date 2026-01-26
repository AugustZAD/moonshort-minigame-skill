import { _decorator, Component, Label } from 'cc';

const { ccclass, property, menu } = _decorator;

/**
 * 标签项组件
 * 用于显示单个标签文本
 */
@ccclass('TagItemComponent')
@menu('Components/TagItemComponent')
export class TagItemComponent extends Component {
    @property({ type: Label, tooltip: '标签文本标签' })
    tagLabel: Label | null = null;

    /**
     * 设置标签文本
     */
    setTag(tag: string) {
        if (this.tagLabel) {
            this.tagLabel.string = tag;
        }
    }

    /**
     * 获取标签文本
     */
    getTag(): string {
        return this.tagLabel?.string || '';
    }
}
