/*--------------------------------------------------------------------------------------------
 * Copyright (C) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 *-------------------------------------------------------------------------------------------*/

import * as React from "react";
import { Button, DropdownButton, MenuItem } from "react-bootstrap";
import { connect } from "react-redux";
import SearchInput, { createFilter } from "react-search-input";
import * as actions from "../actions";
import { versionCompare } from "../utils/util";
import BoardItemView from "./BoardItemView";

interface IBoardManagerProps extends React.Props<any> {
    platforms: any;
    categories: any;
    requesting: boolean;
    errorMessage: string;
    installingBoardName: string;
    installErrorMessage: string;
    uninstallingBoardName: string;
    uninstallErrorMessage: string;
    loadBoardPackages: () => void;
    installBoard: (boardName, packageName, arch, version) => void;
    uninstallBoard: (boardName, packagePath) => void;
}

interface IBoardManagerState extends React.Props<any> {
    searchTerm: string;
    category: string;
}

const mapStateToProps = (state) => {
    return {
        platforms: state.boardManagerStore.platforms,
        categories: state.boardManagerStore.categories,
        requesting: state.boardManagerStore.requesting,
        errorMessage: state.boardManagerStore.errorMessage,
        installingBoardName: state.boardManagerStore.installingBoardName,
        installErrorMessage: state.boardManagerStore.installErrorMessage,
        uninstallingBoardName: state.boardManagerStore.uninstallingBoardName,
        uninstallErrorMessage: state.boardManagerStore.uninstallErrorMessage,
    };
};

const mapDispatchToProps = (dispatch) => {
    return {
        loadBoardPackages: () => actions.getBoardPackages(dispatch),
        installBoard: (boardName, packageName, arch, version) => actions.installBoard(dispatch, boardName, packageName, arch, version, () => {
            actions.getBoardPackages(dispatch);
        }),
        uninstallBoard: (boardName, packagePath) => actions.uninstallBoard(dispatch, boardName, packagePath, () => {
            actions.getBoardPackages(dispatch);
        }),
    };
};

class BoardManager extends React.Component<IBoardManagerProps, IBoardManagerState> {

    constructor(props) {
        super(props);
        this.state = {
            searchTerm: "",
            category: "All",
        };
        this.searchUpdate = this.searchUpdate.bind(this);
        this.typeUpdate = this.typeUpdate.bind(this);
    }

    public componentWillMount() {
        this.props.loadBoardPackages();
    }

    public render() {
        function filterType(element, type) {
            switch (type) {
                case "All":
                    return true;
                case "Updatable":
                    if (element.installedVersion && element.versions && element.versions.length) {
                        return versionCompare(element.versions[0], element.installedVersion) > 0;
                    }
                    return false;
                case "Installed":
                    return !!element.installedVersion;
                default:
                    return element.category === type;
            }
        }

        const SEARCH_KEYS = ["name", "boards.name"];
        const filterSearch = createFilter(this.state.searchTerm, SEARCH_KEYS);

        const filteredPlatforms = this.props.platforms.filter((element) => {
            return filterType(element, this.state.category) && filterSearch(element);
        });

        const boardProps = {
            installingBoardName: this.props.installingBoardName,
            installErrorMessage: this.props.installErrorMessage,
            uninstallingBoardName: this.props.uninstallingBoardName,
            uninstallErrorMessage: this.props.uninstallErrorMessage,
            installBoard: this.props.installBoard,
            uninstallBoard: this.props.uninstallBoard,
        };

        const isOperating = this.props.installingBoardName || this.props.uninstallingBoardName;
        return (
        <div className={"boardmanager " + (!!isOperating ? "disabled" : "")}>
            {
                this.props.requesting && (
                    <div className="mask theme-bgcolor">Loading...</div>
                )
            }
            <div className="arduinomanager-toolbar theme-bgcolor">
                <div className="dropdown-label">Type</div>
                <DropdownButton id="typeselector" title={this.state.category} onSelect={this.typeUpdate}>
                    { this.props.categories.map((c, index) => {
                        return (<MenuItem key={index} eventKey={c} active={c === this.state.category}>{c}</MenuItem>);
                    })}
                </DropdownButton>
                <SearchInput className="search-input" placeholder="Filter your search..." onChange={this.searchUpdate} />
            </div>
            <div className="arduinomanager-container">
                {
                    filteredPlatforms.map((p, index) => {
                        return (<BoardItemView key={p.name} platform={p} {...boardProps} />);
                    })
                }
            </div>
            <div className="arduinomanager-footer"></div>
        </div>);
    }

    private typeUpdate(eventKey: any, event?: React.SyntheticEvent<{}>): void {
        this.setState({
            category: eventKey,
        });
    }

    private searchUpdate(term) {
        this.setState({
            searchTerm: term,
        });
    }
}

export default connect(mapStateToProps, mapDispatchToProps)(BoardManager);
