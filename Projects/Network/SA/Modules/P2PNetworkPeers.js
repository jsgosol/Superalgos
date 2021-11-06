exports.newNetworkModulesP2PNetworkPeers = function newNetworkModulesP2PNetworkPeers() {
    /*
    This module holds the P2P Nodes we are coonected to and that are connected to us.
    */
    let thisObject = {
        outgoingConnectedPeers: undefined,

        /* Framework Functions */
        initialize: initialize,
        finalize: finalize
    }

    const RECONNECT_DELAY = 10 * 1000
    let intervalIdConnectToPeers

    return thisObject

    function finalize() {
        thisObject.outgoingConnectedPeers = undefined
        clearInterval(intervalIdConnectToPeers)
    }

    async function initialize() {

        thisObject.outgoingConnectedPeers = []

        connectToPeers()
        intervalIdConnectToPeers = setInterval(connectToPeers, RECONNECT_DELAY);

    }

    async function connectToPeers() {

        if (thisObject.outgoingConnectedPeers.count >= global.env.P2P_NETWORK_NODE_MAX_OUTGOING_PEERS) { return }

        for (let i = 0; i < NT.networkNode.p2pNetwork.p2pNodesToConnect.length; i++) {
            if (thisObject.outgoingConnectedPeers.count >= global.env.P2P_NETWORK_NODE_MAX_OUTGOING_PEERS) { break }
            let peer = {}
            peer.p2pNetworkNode = NT.networkNode.p2pNetwork.p2pNodesToConnect[i]
            if (isOutgoingConnectedPeer(peer) === true) { continue }
            peer.webSocketsClient = SA.projects.network.modules.webSocketsNetworkClient.newNetworkModulesWebSocketsNetworkClient()
            await peer.webSocketsClient.initialize('Network Peer', peer.p2pNetworkNode, onConnectionClosed)
                .then(addPeer)
                .catch(onError)

            function addPeer() {
                thisObject.outgoingConnectedPeers.push(peer)
            }

            function onError(err) {
                if (err !== undefined) {
                    console.log('[ERROR] P2P Network Peers -> onError -> While connecting to node -> ' + peer.p2pNetworkNode.userProfile.userProfileHandle + ' -> ' + peer.p2pNetworkNode.node.name + ' -> ' + err.message)
                } else {
                    console.log('[WARN] P2P Network Peers -> onError -> Peer Not Available at the Moment -> ' + peer.p2pNetworkNode.userProfile.userProfileHandle + ' -> ' + peer.p2pNetworkNode.node.name)
                }
            }

            function onConnectionClosed(webSocketsClientId) {
                for (let i = 0; i < thisObject.outgoingConnectedPeers.length; i++) {
                    let connectedPeer = thisObject.outgoingConnectedPeers[i]
                    if (connectedPeer.webSocketsClient.id === webSocketsClientId) {
                        thisObject.outgoingConnectedPeers.splice(i, 1)
                        return
                    }
                }
            }
        }

        function isOutgoingConnectedPeer(peer) {
            for (let i = 0; i < thisObject.outgoingConnectedPeers.length; i++) {
                let connectedPeer = thisObject.outgoingConnectedPeers[i]
                if (connectedPeer.p2pNetworkNode.node.id === peer.p2pNetworkNode.node.id) {
                    return true
                }
            }
        }
    }
}