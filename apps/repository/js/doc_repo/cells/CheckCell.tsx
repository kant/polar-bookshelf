import * as React from 'react';
import {Input} from "reactstrap";
import {NULL_FUNCTION} from "polar-shared/src/util/Functions";
import {SelectRowType} from "../DocRepoScreen";
import {Arrays} from "polar-shared/src/util/Arrays";

export class CheckCell extends React.Component<IProps> {

    public shouldComponentUpdate(nextProps: Readonly<IProps>, nextState: Readonly<any>, nextContext: any): boolean {

        if (this.props.viewIndex !== nextProps.viewIndex) {
            return true;
        }

        return ! Arrays.equal(this.props.selected, nextProps.selected);

    }

    public render() {

        const {selected, viewIndex, selectRow} = this.props;

        return (<div style={{lineHeight: '1em'}}>

                <Input checked={selected.includes(viewIndex)}
                       style={{
                           marginLeft: 'auto',
                           marginRight: 'auto',
                           margin: 'auto',
                           position: 'relative',
                           top: '2px',
                           width: '16px',
                           height: '16px',
                       }}
                       className="m-auto"
                       onChange={NULL_FUNCTION}
                       onClick={(event) => selectRow(viewIndex, event.nativeEvent, 'checkbox')}
                       type="checkbox"/>

                {/*<i className="far fa-square"></i>*/}

            </div>
        );

    }

}

interface IProps {
    readonly viewIndex: number;
    readonly selected: ReadonlyArray<number>;
    readonly selectRow: (selectedIdx: number, event: MouseEvent, type: SelectRowType) => void;

}
